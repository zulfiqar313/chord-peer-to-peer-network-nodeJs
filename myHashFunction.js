const crypto = require('crypto');

// envoking the env file for getting the keys
const myEnvKeys = process.env.KEYS || "";

// indentifiers generation using the md5 hash function. 
const myHashedFunction = myEnvKeys.split(" ").map(myKey => {
  const hashingKey = crypto.createHash('md5').update(myKey).digest('hex');
  return hashingKey;
}).join(" ");

console.log(myHashedFunction)

