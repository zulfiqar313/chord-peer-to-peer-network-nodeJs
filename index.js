const axios = require('axios');
var express = require('express');
const crypt = require('crypto');
const os = require("os");
const fetch = require('node-fetch');
const app = express();

app.use(express.text());

app.use(express.urlencoded({extended: false}));

app.use(express.json());


// Getting host name
const myHost = os.hostname();

// getting variables form .env
const myPort = process.env.PORT || 50009;
let neighborsIds = process.env.IDENTIFIER_NEIGHBOURS_ID || "";
let neighborAddress = process.env.ADDRESSES_OF_NEIGHBOURS || "";
const objectMapping = process.env.OBJECT_MAPPING || "";
const indexNode = process.env.INDEX || "";
const myID = process.env.MY_ID || "";
let myST = process.env.STATE || "";
let myState = JSON.parse(myST)


const myAdd = myHost.substring(0, myHost.indexOf('.'));

//Getting address
const myAddress = `${myAdd}:${myPort}`;

// sorting out map here.
function mySortTheMap(mapping) {
  let mapResults = {};

  Object.keys(mapping).sort().forEach(function(myKey) {
    mapResults[myKey] = mapping[myKey];
  });

  return mapResults;
};

// object map creation in [key_of_identifier]: [myValue] format
let objectMap = objectMapping.split(" ").sort().reduce((myacq, myreqItem) => {

  if (!myreqItem) {
    return myacq;
  };

  const myIdNodeValue = myreqItem.split(":")[0];
  const myIdentifierValue = myreqItem.split(":")[1];
  const value = myIdentifierValue.split(",")[1];

  const result = {
    [myIdNodeValue]: value
  }
  return { ...myacq, ...result };
}, {});


// put api to store key value.
app.put('/storage/:key', function (storageReq, storageRes) {
  if(myState){
    return storageRes.status(500).json("I am crashed");
  }
  // Getting the values from .env file, 
  const previousNodeId = neighborsIds.split(" ")[0];
  const nextNodeId = neighborsIds.split(" ")[1];


  const previousNodeAddress = neighborAddress.split(" ")[0];
  const nextNodeAddress = neighborAddress.split(" ")[1];

  const previousNodeHostname = previousNodeAddress.split(":")[0];
  const previousNodePort = previousNodeAddress.split(":")[1];

  const nextNodeHostName = nextNodeAddress.split(":")[0];
  const nextNodePort = nextNodeAddress.split(":")[1];


  // Getting value from request.
  const value = Object.keys(storageReq.body)[0];
  // Getting key from parameter.
  const paramsKey = storageReq.params.key;
  // hashing the paramsKey.
  const hashedKey = crypt.createHash('md5').update(paramsKey).digest('hex');
  


   // when we found the key
  if (objectMap[hashedKey]) {
  // Overwritting our value
    objectMap[hashedKey] = value;
     // now logging new objectMap
    console.dir(objectMap, { depth: null });
    // message of updated success. 
    storageRes.status(200).json(`value modified: ${value}, paramsKey: ${paramsKey}, hashedKey: ${hashedKey} on host ${myHost}:${myPort} and myID: ${myID}` );

  // if not found
  } else {
    // Handlling the 0 node.
    if (indexNode == 0) {
      // Asking previous node for data
      // as  the node 0 can store data that its own key is greater than the final node in ring. If the storage key is greater then the next node storage key but is also less than the final node, then asking the final node.
      if (hashedKey > nextNodeId && hashedKey < previousNodeId) {
        // put api call to previous node
        axios.put(`http://${previousNodeHostname}:${previousNodePort}/storage/${paramsKey}`, `${value}`)
          .then((_myRes) => {
            const myResult = _myRes.data;
            storageRes.status(200).json(myResult)
          }).catch((_myErr) => {
            console.error(_myErr);
          });
       // checking the next node for the data, and looking that its key is also lesser than in the next node.
      } else if (hashedKey > myID && hashedKey < nextNodeId) {
        // put api call to next node
        axios.put(`http://${nextNodeHostName}:${nextNodePort}/storage/${paramsKey}`, `${value}`)
          .then((_myRes) => {
            const myResult = _myRes.data;
            storageRes.status(200).json(myResult)
          }).catch((_myErr) => {
              console.error(_myErr);
          });
        // Storing the data when the  storage key is lesser than it own self or storage key is greater than last node.
      } else {
        // Storing value
        objectMap[hashedKey] = value;
        // Sorting the objectMap after entering new value
        objectMap = mySortTheMap(objectMap);
        // Logging new objectMap
        console.dir(objectMap, { depth: null });
         // value created successfully reply.
        storageRes.status(200).send(`value is stored: ${value}, paramsKey: ${paramsKey}, hashedKey: ${hashedKey} on host ${myHost}:${myPort} and myID: ${myID}` );
      }

     // Handling other node than 0
    } else {

      // Asking previous node for data if the storage key of data is lesser than previous node
      if (hashedKey < previousNodeId) {
        // put api call to previous node
        axios.put(`http://${previousNodeHostname}:${previousNodePort}/storage/${paramsKey}`, `${value}`)
          .then((_myRes) => {
            const myResult = _myRes.data;
            storageRes.status(200).json(myResult)
          }).catch((_myErr) => {
              console.error(_myErr);
          });
          
       // Asking next node for data if storage key of  data is greater than it own self

      } else if (hashedKey > myID) {
        // put api call to next node
        axios.put(`http://${nextNodeHostName}:${nextNodePort}/storage/${paramsKey}`, `${value}`)
          .then((_myRes) => {
            const myResult = _myRes.data;
            storageRes.status(200).json(myResult)
          }).catch((_myErr) => {
              console.error(_myErr);
          });

      // Finally storing  data if storage key is greater than  node before and the storage key is lesser than its own self
      } else {
        // Storing value
        objectMap[hashedKey] = value;
         // Sorting the objectMap after entering new value
        objectMap = mySortTheMap(objectMap);
          // Logging new objectMap
        
        console.dir(objectMap, { depth: null });
          // value created successfully reply.
        storageRes.status(200).send(`value created: ${value}, paramsKey: ${paramsKey}, hashedKey: ${hashedKey} on node ${myHost}:${myPort} and myID: ${myID}` );
      }
    }
  }
});

// get api for getting values
app.get('/storage/:key', function (gettingReq, gettingRes) {
  if(myState){
    return response.status(500).json("I am crashed");
  }
  // Getting the values from .env file.

  const previousNodeId = neighborsIds.split(" ")[0];
  const nextNodeId = neighborsIds.split(" ")[1];


  const previousNodeAddress = neighborAddress.split(" ")[0];
  const nextNodeAddress = neighborAddress.split(" ")[1];

  const previousNodeHostname = previousNodeAddress.split(":")[0];
  const previousNodePort = previousNodeAddress.split(":")[1];

  const nextNodeHostName = nextNodeAddress.split(":")[0];
  const nextNodePort = nextNodeAddress.split(":")[1];

  // getting the key and value
  const value = gettingReq.body;
  // Getting the key url from params
  const paramsKey = gettingReq.params.key;
  // Use the same hash function to hash the key obtained from above
  const hashedKey = crypt.createHash('md5').update(paramsKey).digest('hex');
  
  // check if paramsKey is found
  if (objectMap[hashedKey]) {
    console.log("My host:", myHost);

     // Response with the value
    gettingRes.status(200).json(objectMap[hashedKey])

  // If the paramsKey is not found
  } else {
    // Handling the node 0
    if (indexNode == 0) {
      if (hashedKey > nextNodeId && hashedKey < previousNodeId) {
        axios.get(`http://${previousNodeHostname}:${previousNodePort}/storage/${paramsKey}`)
          .then((myRes) => {
            const myResult = myRes.data;
            gettingRes.status(200).json(myResult)
          }).catch((_err) => {
            gettingRes.status(404).json("NOT FOUND")
          });

      } else if (hashedKey > myID && hashedKey < nextNodeId) {
        axios.get(`http://${nextNodeHostName}:${nextNodePort}/storage/${paramsKey}`)
        .then((myRes) => {
          const myResult = myRes.data;
          gettingRes.status(200).json(myResult)
        }).catch((_err) => {
          gettingRes.status(404).json("NOT FOUND")
        });

      // key is less than its own self or key greater than last node is not found

      } else {
        gettingRes.status(404).json("NOT FOUND");
      }

    // nodes other than 0 handling

    } else {
      
      if (hashedKey < previousNodeId) {
        axios.get(`http://${previousNodeHostname}:${previousNodePort}/storage/${paramsKey}`)
        .then((myRes) => {
          const myResult = myRes.data;
          gettingRes.status(200).json(myResult)
        }).catch((_err) => {
          gettingRes.status(404).json("NOT FOUND")
        });
      
      } else if (hashedKey > myID) {
        axios.get(`http://${nextNodeHostName}:${nextNodePort}/storage/${paramsKey}`)
        .then((myRes) => {
          const myResult = myRes.data;
          gettingRes.status(200).json(myResult)
        }).catch((_err) => {
          gettingRes.status(404).json("NOT FOUND")
        });
      } else {
   
        gettingRes.status(404).json("NOT FOUND");
      }
    }
  }
});

//API for getting the nodes neighbors
app.get('/neighbors', function (request, response) {
  if(myState){
    return response.status(500).json("I am crashed");
  }
  
  const neighborResult = neighborAddress.split(" ");

  response.status(200).json(neighborResult);
});

// get api to get info of nodes.
app.get('/node-info', function (request, response) {
  if(myState){
    return response.status(500).json("I am crashed");
  }

  // Splitting neighborAddress into an array format and the result back.
  const previousNodeAddress = neighborAddress.split(" ")[0];
  const nextNodeAddress = neighborAddress.split(" ")[1];

  
  //node info
  const nodeInfo = {
     node_key : myID ,
     successor : nextNodeAddress ,
     others:[
      previousNodeAddress
    ],
    sim_crash : myState
  }

  response.status(200).json(nodeInfo);

});

// post api for joining.
app.post(`/join`,async function (joiningReq, joiningRes) {
  if(myState){
    return joiningRes.status(500).json("I am crashed");
  }
  const previousNodeId = neighborsIds.split(" ")[0];
  const previousNodeAddress = neighborAddress.split(" ")[0];

  //Extracting the nprime from the url
  const nprime = joiningReq.query.nprime;

  //last node edge case.
  const lastNodeInd = joiningReq.query.id;

  const joinAddress = nprime.split(":")
  

  let joinURL;
  let joinOptions;
  const prevousId = previousNodeId;
  const prevousAdd = previousNodeAddress;
  let myNeighbors;
  let myAddresses;

  joinOptions = {
    method: "POST",
    headers: {
        "Content-Type": "appliction/json",
    },
  };

  //if last node
  if(lastNodeInd){
    joinURL = `http://${joinAddress[0]}:${joinAddress[1]}/add-node/?myNodeId=${myID}&myNodeAddress=${myAddress}&lastNodeInd=${lastNodeInd}`;
  }else{
    joinURL = `http://${joinAddress[0]}:${joinAddress[1]}/add-node/?myNodeId=${myID}&myNodeAddress=${myAddress}`;
  }
   

  try {

    //try to check if the current node is the predecessor of the nprime host.
    const response = await fetch(joinURL, joinOptions);

    let joinResult = await response.json();   
    
  //in the egde case setting the last node to 0 node.

  if(joinResult.myID){
    myNeighbors = `${prevousId} ${myID}`
    myAddresses = `${prevousAdd} ${nprime}`
    neighborsIds = myNeighbors;
    neighborAddress = myAddresses;

    if(neighborsIds.split(' ')[1] === myID && neighborAddress.split(' ')[1] === joinAddress){

      return joiningRes.status(200).json(" ");

    }
  }
    
    
    if(joinResult.prevousId){

    myNeighbors = `${joinResult.prevousId} ${joinResult.id}`
    myAddresses = `${joinResult.prevousAdd} ${joinResult.add}`
    neighborsIds = myNeighbors;
    neighborAddress = myAddresses;

      const previousNodeHostName = joinResult.prevousAdd.split(":")[0];
      const previousNodePortNumber = joinResult.prevousAdd.split(":")[1];
      
      const urlOne = `http://${previousNodeHostName}:${previousNodePortNumber}/update-info/?nextIdOfNode=${myID}&nextAddOfNode=${myAddress}`;

      const responseOne = await fetch(urlOne, joinOptions);

      let resultOne = await responseOne.json();
    
      //this node must be the successor of the predecessor
      if(resultOne === "Predecessor is updated" && neighborsIds.split(' ')[0] === joinResult.prevousId && neighborsIds.split(' ')[1] === joinResult.id && neighborAddress.split(' ')[0] === joinResult.prevousAdd && neighborAddress.split(' ')[1] === joinResult.add){
        
        return joiningRes.status(200).json(" ");
      
    
      }

    }

    
  } catch(err){

    return joiningRes.status(500).json("Joining Failed");
  }


});

// post api for leaving
app.post('/leave', async function (leavingReq, leavingResponse) {
  if(myState){
    return leavingResponse.status(500).json("I am crashed");
  }


  // Getting values from .env file.
  const previousNodeId = neighborsIds.split(" ")[0];
  const nextNodeId = neighborsIds.split(" ")[1];


  const previousNodeAddress = neighborAddress.split(" ")[0];
  const nextNodeAddress = neighborAddress.split(" ")[1];

  const previousNodeHostName = previousNodeAddress.split(":")[0];
  const previousNodePortNumber = previousNodeAddress.split(":")[1];

  const nextNode_hostname = nextNodeAddress.split(":")[0];
  const nextNode_portNum = nextNodeAddress.split(":")[1];

  let leavingOptions;
  const prevousId = previousNodeId;
  const prevousAdd = previousNodeAddress;
  const nextIdOfNode = nextNodeId;
  const nextAddOfNode = nextNodeAddress;
  let myNeighbors;
  let myAddresses;


  leavingOptions = {
    method: "POST",
    headers: {
        "Content-Type": "appliction/json",
    },
  };

  //api to leave node from the network
  const leavingURL = `http://${nextNode_hostname}:${nextNode_portNum}/update-info?prevousId=${prevousId}&prevousAdd=${prevousAdd}`;
  const urlOne = `http://${previousNodeHostName}:${previousNodePortNumber}/update-info?nextIdOfNode=${nextIdOfNode}&nextAddOfNode=${nextAddOfNode}`;
 
  try {

    //Updating the previous or the next node information in the successor
    const response = await fetch(leavingURL, leavingOptions);
    const responseOne = await fetch(urlOne, leavingOptions);

    let leavingResult = await response.json();   
    let resultOne = await responseOne.json();


    //current node must be successor & predecessor of its own
    if( leavingResult === "Successor is updated" && resultOne === "Predecessor is updated"){

      myNeighbors = `${myID} ${myID}`
      myAddresses = `${myAddress} ${myAddress}`
      neighborsIds = myNeighbors;
      neighborAddress = myAddresses;
      
      if(neighborAddress.split(' ')[0] === `${myAddress}` && neighborAddress.split(' ')[1] === `${myAddress}`){
        return leavingResponse.status(200).json(" ");
      } 

    }
    
  } catch(err){

    return leavingResponse.status(500).json("Leaving is Failed");
  }
    
  
});

// sim-crash api
app.post('/sim-crash', function (request, response) {
 myState = true
 if(myState === true){
  response.status(500).json("sim-crashed");
 }
});

// sim-recover api
app.post('/sim-recover', function (request, response) {
 myState = false
 if(myState === false){
  response.status(200).json("sim-recovered");
 }
});

//a post api to join the node to the network and return information of its successor or predecessor
app.post('/add-node', function (addReq, addRes) {


  // Getting values from .env file. 
  const previousNodeId = neighborsIds.split(" ")[0];
  const nextNodeId = neighborsIds.split(" ")[1];
  const previousNodeAddress = neighborAddress.split(" ")[0];
  const nextNodeAddress = neighborAddress.split(" ")[1];

  let myNeighbors;
  let myAddresses;

  const prevousId = previousNodeId;
  const prevousAdd = previousNodeAddress;

  //Recieveing the data of node
  const addNodedata = addReq.query;

  //if the node index is equal to lastNodeInd then it is the last node only in the edge case.
  if(indexNode === addNodedata.lastNodeInd){
    myNeighbors = `${addNodedata.myNodeId} ${nextNodeId}`
    myAddresses = `${addNodedata.myNodeAddress} ${nextNodeAddress}`
    neighborsIds = myNeighbors;
    neighborAddress = myAddresses;
  }

  //Updating the previous to the nodeJoin 
  if(addNodedata.myNodeId){
    myNeighbors = `${addNodedata.myNodeId} ${nextNodeId}`
    myAddresses = `${addNodedata.myNodeAddress} ${nextNodeAddress}`
    neighborsIds = myNeighbors;
    neighborAddress = myAddresses;
  } 


  if(neighborsIds.split(' ')[0] === addNodedata.myNodeId && neighborAddress.split(' ')[0] === addNodedata.myNodeAddress && indexNode === addNodedata.lastNodeInd){

    return addRes.status(200).json(myID);
  }
  else if(neighborsIds.split(' ')[0] === addNodedata.myNodeId && neighborAddress.split(' ')[0] === addNodedata.myNodeAddress){

    const myPreviousData = {
     prevousId,
     prevousAdd,
     id : myID,
     add: myAddress
    }
    return addRes.status(200).json(myPreviousData);
  }
  else {
    return addRes.status(500).json("The add node is failed")
  }
 
});

// a post api to update information for join and leave calls
app.post('/update-info', function (updateReq, updateRes) {  
  
  // Getting values from .env file. 

  const previousNodeId = neighborsIds.split(" ")[0];
  const nextNodeId = neighborsIds.split(" ")[1];
  const previousNodeAddress = neighborAddress.split(" ")[0];
  const nextNodeAddress = neighborAddress.split(" ")[1];

  let myNeighbors;
  let myAddresses;

  //Recieving the Next or the pervous data of the node
  const updateInfoData = updateReq.query;

  //Updating the predecessor of the successor
  if(updateInfoData.prevousId){
    myNeighbors = `${updateInfoData.prevousId} ${nextNodeId}`
    myAddresses = `${updateInfoData.prevousAdd} ${nextNodeAddress}`
    neighborsIds = myNeighbors;
    neighborAddress = myAddresses;
    
  } 

  //Updating the successor of the predecessor
  if(updateInfoData.nextIdOfNode){
    myNeighbors = `${previousNodeId} ${updateInfoData.nextIdOfNode}`
    myAddresses = `${previousNodeAddress} ${updateInfoData.nextAddOfNode}`
    neighborsIds = myNeighbors;
    neighborAddress = myAddresses;
    
  }

  if(neighborsIds.split(' ')[0] === updateInfoData.prevousId && neighborAddress.split(' ')[0] === updateInfoData.prevousAdd){

    return updateRes.status(200).json("Successor is updated");

  }else if(neighborsIds.split(' ')[1] === updateInfoData.nextIdOfNode && neighborAddress.split(' ')[1] === updateInfoData.nextAddOfNode){

   return updateRes.status(200).json("Predecessor is updated");

  }
  else {

    return updateRes.status(500).json("Removing the node is failed")

  }
 
});


//Server initialize with myPort number
var server = app.listen(myPort, function () {

  console.log(`The Node ${myHost} is listening on the myPort ${myPort}`);

});

