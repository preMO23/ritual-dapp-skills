// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ShadowLensProtocol {

    struct Analysis {
        bytes32 requestId;
        address requester;
        string handle;
        uint256 score;
        string reason;
        bool fulfilled;
    }

    mapping(bytes32 => Analysis) public analyses;

    address public immutable oracle;
    uint256 public requestCount;

    event AnalysisRequested(
        bytes32 indexed requestId,
        address indexed requester,
        string handle
    );

    event AnalysisFulfilled(
        bytes32 indexed requestId,
        uint256 score,
        string reason
    );

    constructor(address _oracle) {
        oracle = _oracle;
        requestCount = 0;
    }

    function requestAnalysis(string calldata handle) external {
        requestCount++;
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, handle, block.timestamp, requestCount)
        );

        analyses[requestId] = Analysis({
            requestId: requestId,
            requester: msg.sender,
            handle: handle,
            score: 0,
            reason: "",
            fulfilled: false
        });

        emit AnalysisRequested(requestId, msg.sender, handle);
    }

    function fulfillAnalysis(
        bytes32 requestId,
        uint256 score,
        string calldata reason
    ) external {
        require(msg.sender == oracle, "Only oracle can fulfill");
        require(!analyses[requestId].fulfilled, "Already fulfilled");

        Analysis storage a = analyses[requestId];
        a.score = score;
        a.reason = reason;
        a.fulfilled = true;

        emit AnalysisFulfilled(requestId, score, reason);
    }

    function getAnalysis(bytes32 requestId)
        external
        view
        returns (Analysis memory)
    {
        return analyses[requestId];
    }
}