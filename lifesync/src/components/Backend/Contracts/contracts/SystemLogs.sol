// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SystemLogs {
    struct Log {
        string userId;
        string message;
        uint256 timestamp;
    }

    Log[] public logs;
    mapping(bytes32 => uint256[]) private userLogIndexes;

    event LogAdded(uint256 logId, string userId, string message);

    function addLog(string calldata _userId, string calldata _message) external {
        uint256 logId = logs.length;
        logs.push(Log(_userId, _message, block.timestamp));
        bytes32 key = keccak256(abi.encodePacked(_userId));
        userLogIndexes[key].push(logId);
        emit LogAdded(logId, _userId, _message);
    }

    function getLogsByUser(string calldata _userId) external view returns (string[] memory) {
        bytes32 key = keccak256(abi.encodePacked(_userId));
        uint256[] storage indexes = userLogIndexes[key];
        string[] memory result = new string[](indexes.length);

        for (uint256 i = 0; i < indexes.length; i++) {
            Log storage log = logs[indexes[i]];
            result[i] = string(
                abi.encodePacked(
                    '{"userId":"',
                    log.userId,
                    '","message":"',
                    log.message,
                    '","timestamp":',
                    uint2str(log.timestamp),
                    '}'
                )
            );
        }

        return result;
    }

    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 len;

        while (j != 0) {
            len++;
            j /= 10;
        }

        bytes memory bstr = new bytes(len);
        uint256 k = len;

        while (_i != 0) {
            k = k - 1;
            uint8 temp = uint8(48 + uint256(_i % 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }

        return string(bstr);
    }
}
