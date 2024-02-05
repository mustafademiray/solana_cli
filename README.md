after cloning this repo and opening a terminal in the folder

**install the requirements**  
`npm install`

**generate a new wallet**  
`npm start new`

this command generates a `wallet.json file that contains: public key, secret key and the balance data  
NOTE: generating a new wallet results a overriding of the existing `wallet.json` file, use this only for generating a new wallet!

**get an airdrop SOL for the generated wallet on devnet**  
`npm start airdrop`

**transfer a value of SOL to a provided address**  
`npm start transfer [address] [value]`  
this command also updates the balance in the json file

//latest used wallet: HKyAvesRQeHW75aqXB3RDsmvjQ6jddiMDVZK945HLaWg
