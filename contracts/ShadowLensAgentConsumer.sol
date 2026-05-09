// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ShadowLensAgentConsumer
 * @notice Smart contract for X/Twitter account shadow ban risk assessment on Ritual Chain
 * @dev Integrates with Ritual precompiles for HTTP and Sovereign Agent calls
 */

contract ShadowLensAgentConsumer {
    // Ritual precompile addresses
    address public constant SOVEREIGN_AGENT = address(0x080C);
    address public constant HTTP_PRECOMPILE = address(0x0801);
    address public constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

    address public owner;

    // Analysis status
    enum Status {
        Pending,
        Completed
    }

    // Risk assessment levels
    enum RiskLevel {
        Unknown,
        Low,
        Medium,
        High
    }

    // Analysis request data
    struct Analysis {
        bytes32 requestId;
        address requester;
        string handle;
        RiskLevel riskLevel;
        string engagementHealth;
        string postingPattern;
        string contentRisk;
        string suggestedFixes;
        bool weeklyMonitor;
        Status status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // State mappings
    mapping(bytes32 => Analysis) public analyses;
    mapping(address => bool) public authorizedOracles;
    mapping(bytes32 => uint256) public monitorCadenceSeconds;

    // Events
    event AnalysisRequested(
        bytes32 indexed requestId,
        address indexed requester,
        string handle,
        bool weeklyMonitor
    );

    event AnalysisCompleted(
        bytes32 indexed requestId,
        RiskLevel riskLevel,
        string engagementHealth,
        string postingPattern,
        string contentRisk,
        string suggestedFixes
    );

    event PrecompileSubmitted(
        address indexed precompile,
        bytes input,
        bytes output
    );

    event WeeklyMonitorScheduled(
        bytes32 indexed requestId,
        uint256 cadenceSeconds
    );

    event OracleUpdated(address indexed oracle, bool enabled);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(authorizedOracles[msg.sender], "Not authorized oracle");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    // Owner functions
    function setOracle(address oracle, bool enabled) external onlyOwner {
        authorizedOracles[oracle] = enabled;
        emit OracleUpdated(oracle, enabled);
    }

    // Analysis request functions
    function requestAnalysisWithAgent(
        bytes calldata precompileInput,
        string calldata handle,
        bool weeklyMonitor
    ) external returns (bytes memory) {
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, handle, block.timestamp)
        );

        analyses[requestId] = Analysis({
            requestId: requestId,
            requester: msg.sender,
            handle: handle,
            riskLevel: RiskLevel.Unknown,
            engagementHealth: "",
            postingPattern: "",
            contentRisk: "",
            suggestedFixes: "",
            weeklyMonitor: weeklyMonitor,
            status: Status.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit AnalysisRequested(requestId, msg.sender, handle, weeklyMonitor);

        (bool ok, bytes memory output) = SOVEREIGN_AGENT.call(precompileInput);
        require(ok, "Sovereign agent call failed");

        emit PrecompileSubmitted(SOVEREIGN_AGENT, precompileInput, output);
        return output;
    }

    function requestAnalysisWithHttp(
        bytes calldata httpInput,
        string calldata handle,
        bool weeklyMonitor
    ) external returns (bytes memory) {
        bytes32 requestId = keccak256(
            abi.encodePacked(msg.sender, handle, block.timestamp)
        );

        analyses[requestId] = Analysis({
            requestId: requestId,
            requester: msg.sender,
            handle: handle,
            riskLevel: RiskLevel.Unknown,
            engagementHealth: "",
            postingPattern: "",
            contentRisk: "",
            suggestedFixes: string(httpInput),
            weeklyMonitor: weeklyMonitor,
            status: Status.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit AnalysisRequested(requestId, msg.sender, handle, weeklyMonitor);

        (bool ok, bytes memory output) = HTTP_PRECOMPILE.call(httpInput);
        require(ok, "HTTP precompile call failed");

        analyses[requestId].status = Status.Completed;
        analyses[requestId].updatedAt = block.timestamp;
        analyses[requestId].suggestedFixes = string(output);

        emit PrecompileSubmitted(HTTP_PRECOMPILE, httpInput, output);
        emit AnalysisCompleted(
            requestId,
            RiskLevel.Unknown,
            "",
            "",
            "",
            string(output)
        );
        return output;
    }

    // Callback function for async results
    function onSovereignAgentResult(
        bytes32 jobId,
        bytes calldata result
    ) external {
        require(msg.sender == ASYNC_DELIVERY, "Unauthorized callback sender");
        Analysis storage analysis = analyses[jobId];
        require(analysis.requester != address(0), "Unknown jobId");
        require(analysis.status == Status.Pending, "Job already completed");

        analysis.status = Status.Completed;
        analysis.updatedAt = block.timestamp;
        analysis.suggestedFixes = string(result);

        emit AnalysisCompleted(
            jobId,
            analysis.riskLevel,
            analysis.engagementHealth,
            analysis.postingPattern,
            analysis.contentRisk,
            analysis.suggestedFixes
        );
    }

    // Oracle fulfillment function
    function fulfillAnalysis(
        bytes32 requestId,
        RiskLevel riskLevel,
        string calldata engagementHealth,
        string calldata postingPattern,
        string calldata contentRisk,
        string calldata suggestedFixes
    ) external onlyOracle {
        Analysis storage analysis = analyses[requestId];
        require(analysis.requester != address(0), "Unknown requestId");
        require(analysis.status == Status.Pending, "Already completed");

        analysis.riskLevel = riskLevel;
        analysis.engagementHealth = engagementHealth;
        analysis.postingPattern = postingPattern;
        analysis.contentRisk = contentRisk;
        analysis.suggestedFixes = suggestedFixes;
        analysis.status = Status.Completed;
        analysis.updatedAt = block.timestamp;

        emit AnalysisCompleted(
            requestId,
            riskLevel,
            engagementHealth,
            postingPattern,
            contentRisk,
            suggestedFixes
        );
    }

    // Monitoring functions
    function scheduleWeeklyMonitor(
        bytes32 requestId,
        uint256 cadenceSeconds
    ) external {
        Analysis storage analysis = analyses[requestId];
        require(
            analysis.requester == msg.sender || msg.sender == owner,
            "Unauthorized"
        );
        require(cadenceSeconds > 0, "Cadence must be positive");

        monitorCadenceSeconds[requestId] = cadenceSeconds;
        emit WeeklyMonitorScheduled(requestId, cadenceSeconds);
    }

    // View functions
    function getAnalysis(bytes32 requestId)
        external
        view
        returns (Analysis memory)
    {
        return analyses[requestId];
    }

    function isOracleAuthorized(address oracle)
        external
        view
        returns (bool)
    {
        return authorizedOracles[oracle];
    }

    function getMonitorCadence(bytes32 requestId)
        external
        view
        returns (uint256)
    {
        return monitorCadenceSeconds[requestId];
    }
}
