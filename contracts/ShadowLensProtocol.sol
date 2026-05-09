// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ShadowLensProtocol {
    enum Status {
        Pending,
        Completed
    }

    struct Analysis {
        address requester;
        string handle;
        uint256 score;
        string reason;
        Status status;
        uint256 createdAt;
    }

    mapping(bytes32 => Analysis) public analyses;
    mapping(address => bool) public authorizedOracles;

    address public owner;
    uint256 public requestFee = 0.001 ether;

    event AnalysisRequested(
        bytes32 indexed requestId,
        address indexed requester,
        string handle,
        uint256 timestamp
    );

    event AnalysisCompleted(
        bytes32 indexed requestId,
        uint256 score,
        string reason
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(
            authorizedOracles[msg.sender],
            "Not authorized oracle"
        );
        _;
    }

    constructor(address initialOracle) {
        owner = msg.sender;
        authorizedOracles[initialOracle] = true;
    }

    function setOracle(
        address oracle,
        bool status
    ) external onlyOwner {
        authorizedOracles[oracle] = status;
    }

    function requestAnalysis(
        string memory handle
    ) external payable {
        require(
            msg.value >= requestFee,
            "Insufficient request fee"
        );

        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                handle,
                block.timestamp
            )
        );

        analyses[requestId] = Analysis({
            requester: msg.sender,
            handle: handle,
            score: 0,
            reason: "",
            status: Status.Pending,
            createdAt: block.timestamp
        });

        emit AnalysisRequested(
            requestId,
            msg.sender,
            handle,
            block.timestamp
        );
    }

    function fulfillAnalysis(
        bytes32 requestId,
        uint256 score,
        string memory reason
    ) external onlyOracle {
        require(
            analyses[requestId].requester != address(0),
            "Request does not exist"
        );

        require(
            analyses[requestId].status == Status.Pending,
            "Already completed"
        );

        analyses[requestId].score = score;
        analyses[requestId].reason = reason;
        analyses[requestId].status = Status.Completed;

        emit AnalysisCompleted(
            requestId,
            score,
            reason
        );
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}