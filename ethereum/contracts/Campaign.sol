pragma solidity ^0.8.2;

contract CampaignFactory {
    
    address[] public deployedCampaigns;
    
    function createCampaign(uint minimum) public {
//Deploy an instance of the Campaign contract
        Campaign newCampaign = new Campaign(minimum, msg.sender); //Campaign is the variable which will hold the address of the deployed instance
        deployedCampaigns.push(address(newCampaign));
    }
    
    function getDeployedCampaigns() public view returns(address[] memory) { 
        return deployedCampaigns;
    }
}

contract Campaign {
    
//Spending request derfinition
    struct Request {
        string description;
        uint value;
        address payable recipient;
        uint approvalCount;
        mapping(address => bool) approvals;
        bool complete;
    }
    
//State variables    
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approverCount;
    uint public requestCount; //request counter to initialize new requests in create request function
    mapping (uint => Request) public requests; //mapping containing all request objects by index (Similar to array)
    
    modifier ownerOnly {
        
        require (msg.sender == manager, "Operation can only be called by campaign Manager");
        _;
    }
    
    constructor(uint minimum, address creator) {
        
        manager = creator; //ddress of the account who instantiated the contract
        minimumContribution = minimum; //Min contribution defined by the creator
    }
    
    function contribute() public payable {
        
        require(msg.value > minimumContribution, "Contribution should be greater than Minimum Contribution");
        approvers[msg.sender] = true; //set this address as a contributor in mapping
        approverCount++;
    }
    
    function createRequest(string memory desc, uint value, address payable recipient) public ownerOnly {
        
    //Create a new request on the state variable and put it into the request mapping value table
        Request storage r = requests[requestCount++];
        r.description = desc;
        r.value = value;
        r.recipient = recipient;
        r.complete = false;
        r.approvalCount = 0;
    }
    
    function approveRequest(uint index) public {
        
     //Request storage request = requests[index]; ***You can store the request[index] in a local var abd replace instances of request[index] by "request"
     //Check if the address exists in the contributor mapping and only then allow voting   
        require(approvers[msg.sender], "You need to be a contributor in order to be eligible for voting");
    //Verify that the contributor has not already voted    
        require(!requests[index].approvals[msg.sender], "You have already registered your vote on this request");
        
        requests[index].approvals[msg.sender] = true; //Register a Yes vote for this address
        requests[index].approvalCount++; //Increment number of approvals
    }
    
    function finalizeRequest(uint index) payable public ownerOnly {
        
        Request storage request = requests[index]; //create storage reference for the requesr index
        
        require(!request.complete, "Request has already been completed"); //Check request is not already completed
        require(request.approvalCount > (approverCount / 2), "Approval Denied");
        
        request.recipient.transfer(request.value); //Transfer the amount contained in this request to the recipient address in Wei
        request.complete = true;
    }
    
    function getBal() public view returns (uint) {
        return address(this).balance;
    }
}