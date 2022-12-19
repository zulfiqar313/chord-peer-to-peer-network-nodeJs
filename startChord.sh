# !/bin/bash -l

if [ $# -lt 1 ]
  then
    echo "Enter number of hosts with the startChard.sh file."
    exit
fi

# The below command uses createNodes.sh to generate the hosts.
sh createNodes.sh $1

# Read the storeHostInfo in order store the port, hostname and address for nodes.

LINE=1
while read -r MYNODE
  do
    hostsList[LINE-1]=$MYNODE
    # assign port number randomly
    portsList[LINE-1]=$(( ( RANDOM % (64424-58341) ) + 29321 ))
    # address of the  node
    addressesList[LINE-1]="${MYNODE}:${portsList[LINE-1]}"

    ((LINE++))
done < "./storeHostInfo"

# address of the node is used as key to hash it. 
# hashing function is inside "myHashFunction.js" file
nodeIdentifierIdsString=$(KEYS=${addressesList[*]} node myHashFunction.js)

# Converting the identifiers node into array 
nodeIdentifierIds=(${nodeIdentifierIdsString// / })

# Sorting the identifiers node
IFSORT=$'\n' sortedNodeIdentifierIds=($(sort <<<"${nodeIdentifierIds[*]}")); unset IFSORT

# Getting the total number of node identifiers
totalNodeIdentifier=${#hostsList[@]}

# Sorting the ports, addresses and hosts on the basis of order 
for k in "${!sortedNodeIdentifierIds[@]}"; do
  for i in "${!nodeIdentifierIds[@]}"; do
    if [ "${sortedNodeIdentifierIds[k]}" = "${nodeIdentifierIds[i]}" ]; then
      sortedHosts[k]=${hostsList[i]}
      sortedPorts[k]=${portsList[i]}
      sortedAddresses[k]=${addressesList[i]}
    fi
  done
done

# Storing neighbors for every identifier node
# When sorting is done every identifier node  will get its own previous and the next neighbor
# In case of 0 node, the previous node of 0 will be its last node to form a ring
for j in "${!sortedNodeIdentifierIds[@]}"; do
  for k in "${!nodeIdentifierIds[@]}"; do
    if [ "${sortedNodeIdentifierIds[j]}" = "${nodeIdentifierIds[k]}" ]; then
      if [ ${j} = 0 ]; then
        IDENTIFIER_NEIGHBOURS_ID[j]="${sortedNodeIdentifierIds[totalNodeIdentifier-1]} ${sortedNodeIdentifierIds[${j}+1]}"
        ADDRESSES_OF_NEIGHBOURS[j]="${sortedAddresses[totalNodeIdentifier-1]} ${sortedAddresses[${j}+1]}"
      elif [ ${j} = $((totalNodeIdentifier-1)) ]; then
        IDENTIFIER_NEIGHBOURS_ID[j]="${sortedNodeIdentifierIds[${j}-1]} ${sortedNodeIdentifierIds[0]}"
        ADDRESSES_OF_NEIGHBOURS[j]="${sortedAddresses[${j}-1]} ${sortedAddresses[0]}"
        break
      else
        IDENTIFIER_NEIGHBOURS_ID[j]="${sortedNodeIdentifierIds[${j}-1]} ${sortedNodeIdentifierIds[${j}+1]}"
        ADDRESSES_OF_NEIGHBOURS[j]="${sortedAddresses[${j}-1]} ${sortedAddresses[${j}+1]}"
      fi
    fi
  done
done


# Read the "keyValuePairs" and storing them with format as key, value with one pair on each line
LINE=1
while read -r kv_pair
  do
    # Extracting pairs and the storing it
    PAIRS[LINE-1]=${kv_pair}
    # Spliting pairs and then storing it
    MYKEY=(${kv_pair//,/ })
    # Extracting the key from pair and then storing it
    KEYS[LINE-1]=${MYKEY[0]}
    # Extracting the value from pair and then storing it
    VAL[LINE-1]=${MYKEY[1]}
    ((LINE++))
done < "./keyValuePairs"



# Useing key of the above pair and then hashing it,
hashedKeyString=$(KEYS=${KEYS[*]} node myHashFunction.js)

# Converting identifiers key to array 
hashedKeys=(${hashedKeyString// / })

# first creating and then storing successor for every key and create object map at the same time.
for j in "${!hashedKeys[@]}"; do
  for k in "${!sortedNodeIdentifierIds[@]}"; do
    if [[ "${hashedKeys[j]}" < "${sortedNodeIdentifierIds[k]}" ]]; then
      keysSuccessor[j]="${sortedNodeIdentifierIds[k]}"
      #case handling if object mapping is empty

      if [ -z "${OBJECT_MAPPING[k]}" ]; then
        OBJECT_MAPPING[k]="${hashedKeys[j]}:${PAIRS[j]}"
      else
        OBJECT_MAPPING[k]+=" ${hashedKeys[j]}:${PAIRS[j]}"
      fi
      break
    elif [ ${k} = $((totalNodeIdentifier-1)) ]; then
      keysSuccessor[j]="${sortedNodeIdentifierIds[0]}"
#case handling if object mapping is empty
      if [ -z "${OBJECT_MAPPING[0]}" ]; then
        OBJECT_MAPPING[0]="${hashedKeys[j]}:${PAIRS[j]}"
      else
        OBJECT_MAPPING[0]+=" ${hashedKeys[j]}:${PAIRS[j]}"
      fi
    fi
  done
done

for i in "${!sortedHosts[@]}"; do
  echo "${sortedHosts[i]}:${sortedPorts[i]}"
done >nodesAddresses

# starting server by command "node index.js" on each node
# parameters are passed to the server when code starts.
for i in "${!sortedHosts[@]}"; do    
  ssh -f ${sortedHosts[i]} 'export PORT='"'${sortedPorts[i]}'"' IDENTIFIER_NEIGHBOURS_ID='"'${IDENTIFIER_NEIGHBOURS_ID[i]}'"' ADDRESSES_OF_NEIGHBOURS='"'${ADDRESSES_OF_NEIGHBOURS[i]}'"' OBJECT_MAPPING='"'${OBJECT_MAPPING[i]}'"' INDEX='"'${i}'"' MY_ID='"'${sortedNodeIdentifierIds[i]}'"' STATE=false ;node '"'$(pwd)'"'/index.js'
done