# This is the chord implementation in Node Js. 

It is a scalable peer-to-peer lookup service for internet applications.

To Run the code run the following commands:

1) curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash

restart the terminal

2) nvm install node
3) npm install

Run the servers:

[Optional] To initialize some pre-defined key-value pairs, create a "keysfile". The format of key-value pairs is [key],[value], one pair per line
to start the servers, use "./chord_start X Y", where X start-chord to start chord and Y num of hosts
to start single servers not joined, use "./chord_start X", X is single-nodes and Y num of hosts
Run the test:

start the servers, use "./chord_tests X"
use "./chord_tests X", where x can be "getNeighbors" for testing GET Neighbors API, "getstorageItem" for testing GET data API, and "putstorageItem" for testing PUt data API
use "./chord_tests X", where X can be "grow" for testing Growing from 1 to n nodes, "shrink" for testing from n nodes to n/2, and "tolerance" for testing crashing the nodes

