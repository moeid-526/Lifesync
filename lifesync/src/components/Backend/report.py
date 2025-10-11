import sys
import json
import re
from fpdf import FPDF
from datetime import datetime
import google.generativeai as genai

# Configure Google Generative AI
genai.configure(api_key="AIzaSyASbtmGTMfPqJjbRWNlti0vjLnviz_fP-s")


class PDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_left_margin(20)
        self.set_right_margin(20)
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        self.ln(8)

    def section_title(self, title):
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(40, 40, 40)
        self.cell(0, 10, title, 0, 1, "L")
        self.set_draw_color(160, 160, 160)
        self.set_line_width(0.4)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(6)

    def write_with_formatting(self, text):
        lines = text.split("\n")
        for line in lines:
            stripped_line = line.strip()
            if not stripped_line:
                self.ln(5)
                continue

            # --- Bold main section titles ---
            if re.match(r"^\d+\.\s+(Mood Overview|Chat Insights|Activity Analysis|Recommendations|Closing Message)",
                        stripped_line, re.IGNORECASE):
                self.set_font("Helvetica", "B", 12)
                self.multi_cell(0, 7, stripped_line, align="J")
                self.set_font("Helvetica", "", 12)
                self.ln(4)
                continue

            # --- Clean up any ** or * markers ---
            stripped_line = re.sub(r"\*\*", "", stripped_line)
            stripped_line = re.sub(r"\*(.*?)\*", r"\1", stripped_line)

            # --- Bold recommendation subheadings (e.g., "1. Stay Positive: Keep ...") ---
            if re.match(r"^\d+\.\s+[^:]+:", stripped_line):
                match = re.match(r"^(\d+\.)\s+([^:]+:)\s*(.*)", stripped_line)
                if match:
                    num = match.group(1)
                    subheading = match.group(2)
                    remainder = match.group(3)

                    if not subheading.endswith(": "):
                        subheading = subheading.replace(":", ": ")

                    # Write number + bold subheading, then normal description
                    self.set_font("Helvetica", "B", 12)
                    self.cell(0, 7, f"{num} {subheading}", 0, 1)
                    self.set_font("Helvetica", "", 12)
                    if remainder.strip():
                        self.multi_cell(0, 7, remainder.strip(), align="J")
                    self.ln(3)
                    continue

            # --- Normal paragraphs (justified) ---
            self.multi_cell(0, 7, stripped_line, align="J")
            self.ln(3)


def parse_mongodb_date(date_obj):
    if isinstance(date_obj, dict) and '$date' in date_obj:
        date_str = date_obj['$date']
    elif isinstance(date_obj, str):
        date_str = date_obj
    else:
        return None
    try:
        date_str = date_str.replace('Z', '')
        if '.' in date_str:
            return datetime.fromisoformat(date_str.split('.')[0])
        return datetime.fromisoformat(date_str)
    except (ValueError, AttributeError, TypeError):
        return None


def get_date_range(mood_data):
    if not mood_data:
        return "the past week"
    dates = []
    for entry in mood_data:
        parsed_date = parse_mongodb_date(entry.get("date"))
        if parsed_date:
            dates.append(parsed_date)
    if not dates:
        return "the past week"
    min_date = min(dates).strftime("%B %d")
    max_date = max(dates).strftime("%B %d, %Y")
    return f"{min_date} - {max_date}"


def get_mood_label(value):
    mood_labels = {
        0: "Very Poor",
        1: "Poor",
        2: "Fair",
        3: "Good",
        4: "Very Good",
        5: "Excellent"
    }
    return mood_labels.get(value, "Unknown")


def process_mood_data(mood_data):
    processed = []
    for entry in mood_data:
        parsed_date = parse_mongodb_date(entry.get("date"))
        mood_value = entry.get("value", 0)
        if parsed_date:
            processed.append({
                "date": parsed_date.strftime("%Y-%m-%d"),
                "value": mood_value,
                "mood_label": get_mood_label(mood_value)
            })
    return processed


def process_chats_data(progresses):
    messages = []
    chat_pairs_per_day = progresses.get("chatPairsPerDay", [])
    for day_entry in chat_pairs_per_day:
        pairs = day_entry.get("pairs", [])
        for pair in pairs:
            user_msg = pair.get("user", "")
            bot_msg = pair.get("bot", "")
            timestamp = pair.get("timestamp", {})
            parsed_time = parse_mongodb_date(timestamp)
            messages.append({
                "user": user_msg,
                "bot": bot_msg,
                "timestamp": parsed_time.strftime("%Y-%m-%d %H:%M:%S") if parsed_time else None
            })
    return messages


def generate_ai_report(first_name, mood_data, active_time_data, messages):
    date_range = get_date_range(mood_data)
    current_date = datetime.now().strftime("%B %d, %Y")

    prompt = f"""
Generate a professional weekly report for the LifeSync system in this exact format:

---
LifeSync Weekly Report - {first_name}
Date: {current_date}
Period: {date_range}

1. Mood Overview
Provide a clear, engaging summary of mood fluctuations using this data: {json.dumps(mood_data, indent=2)}.

2. Chat Insights
Analyze themes and emotional expressions from these chats: {json.dumps(messages, indent=2)}.

3. Activity Analysis
Summarize engagement levels using this activity data: {json.dumps(active_time_data, indent=2)}.

4. Recommendations
List 4 actionable recommendations in numbered format for the user's mental health, each with a bold subheading like:
1. Consistent Mood Tracking: description
2. Explore Professional Support: description
...

5. Closing Message
End with an encouraging, empathetic note addressed to {first_name}.
---
The report should read naturally and reflect genuine insight and it should be easy to read and understand and it should not exceed 2 pages.
"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text if response and response.text else None
    except Exception as e:
        print(f"Gemini API error: {e}", file=sys.stderr)
        return None


def generate_pdf(first_name, content):
    pdf = PDF()
    pdf.add_page()

    # Header
    pdf.set_font('Helvetica', 'B', 18)
    pdf.cell(0, 10, f"LifeSync Weekly Report - {first_name}", 0, 1, 'C')
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(0, 10, f"Date: {datetime.now().strftime('%B %d, %Y')}", 0, 1, 'C')

    # Divider (no extra space below)
    pdf.set_draw_color(150, 150, 150)
    pdf.set_line_width(0.5)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(2)  # reduced space

    # Clean redundant lines
    content = re.sub(r"LifeSync Weekly Report(.*?)\n", "", content)
    content = re.sub(r"Date:.*\n", "", content)
    content = re.sub(r"LifeSync Weekly Report for.*? - ", "Period: ", content, flags=re.IGNORECASE)

    # Format cleanup
    pdf.set_font("Helvetica", "", 12)
    safe_content = content.replace("\u2019", "'").replace("\u2013", "-")
    formatted_content = re.sub(r"### (.*)", r"\n\n\1\n", safe_content)
    formatted_content = re.sub(r"---", "\n", formatted_content)

    pdf.write_with_formatting(formatted_content)

    # Footer
    pdf.ln(10)
    pdf.set_draw_color(180, 180, 180)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 10)
    pdf.cell(0, 10, "Generated by LifeSync Wellness System", 0, 0, 'C')

    return pdf.output(dest="S").encode("latin1", "replace")


def main():
    try:
        data = json.load(sys.stdin)
    except Exception as e:
        print(f"❌ Failed to read input JSON: {e}", file=sys.stderr)
        sys.exit(1)

    display_name = data.get("displayName", "User")
    first_name = display_name.split(" ")[0] if display_name else "User"
    progresses = data.get("progresses", {})

    mood_data = process_mood_data(progresses.get("moodData", []))
    active_time_data = progresses.get("activeTimePerDay", [])
    messages = process_chats_data(progresses)

    report_content = generate_ai_report(first_name, mood_data, active_time_data, messages)

    if not report_content:
        report_content = f"""
Period: {get_date_range(mood_data)}

1. Mood Overview:
You recorded {len(mood_data)} mood entries this week.

2. Chat Insights:
You had {len(messages)} conversations with the AI.

3. Activity Analysis:
You logged {len(active_time_data)} active days.

4. Recommendations:
1. Consistent Mood Tracking: Keep tracking your mood daily.
2. Increase Activity Gradually: Maintain consistent activity levels.
3. Practice Mindfulness: Use journaling and meditation.
4. Seek Support: Reach out when you feel low.

5. Closing Message:
Keep going, {first_name}! Your progress matters.
"""

    pdf = generate_pdf(first_name, report_content)
    sys.stdout.buffer.write(pdf)


if __name__ == "__main__":
    main()
