//login stuff
//global variables
var wallet;
var login = false;
var ethersWallet;
//Initialise Wallet
async function GenWallet()
{
console.log('Initialising Wallet');
 wallet = new libsimba.LocalWallet(
    () => {
        //Ask the user for permission before signing
        console.log('Ask the user for permission before signing');
        return Promise.resolve(window.confirm("Do you want to sign this transaction?"))
    }
);
//Check if there's an existing local wallet

    login = false;
    //There is no local wallet, let
    console.log("Not Logged in");

    //Use this to prevent progress output spam
  
    let lastProgress = 0;

    await wallet.generateWallet(
        'test1234',
        (progress) => {
            if (Math.floor(progress * 10) > lastProgress) {
                lastProgress = progress * 10;
                console.log(`Encrypting Wallet ${Math.floor(progress*100)}`);
            }
        });
    
    /* un comment this for generation
       await wallet.generateWalletFromMnemonic(
         'jeans absorb curve mimic task apology green ability cake eyebrow report inner',
         'test1234',
         (progress)=>{
             console.log(`Encrypting Wallet ${progress*100}`);
        });
    */
    
    
    // We can also generate a wallet from a private key, or from a mnemonic
    /* await wallet.generateWalletFromPrivateKey(
         '0x5254aae6a8d34a95a5aff7350d11f5bf46db6deca2182545fbd7267ece2cb486',
         'test1234',
         (progress)=>{
             console.log(`Encrypting Wallet ${progress*100}`);
        });*/
 
    

//Print out the wallet address, you don't need to do this, but useful to see
let address = await wallet.getAddress();
console.log(`Eth Address: ${address}`);
    
}


async function RestoreAccount()
{
    
    var signedPassword;
    let ethersWallet = ethers.Wallet.fromMnemonic(document.getElementById("restorePhrase").value);
       if (ethersWallet)
        {
//we grab the text value from 'signInput' and run the tryParseJson function found below
    
            //that json is then signed here
    let signPromise = ethersWallet.signMessage(document.getElementById("restorePass").value.toString());
       restorePass    
            
   await signPromise.then((signedTransaction)=>{
       
       console.log("Signed Transaction");
        console.log(signedTransaction);
    signedPassword = signedTransaction;
        });
        }
    else{
        return;
    }
    
     let simba = await libsimba.getSimbaInstance(
    'https://api.simbachain.com/v1/AuxEthTest/',
    wallet,
    'b338013bcc5aade572d1100226804d821ab03a299bdd2c9829fe4623c1c0b633');
    
    modalPassword
    let methodParams = {
    username_exact:document.getElementById("restoreUser").value,
    ethKey_exact : await ethersWallet.getAddress(),
    password_exact : signedPassword 
};

await simba.getMethodTransactions('account', methodParams)
    .then(async (ret) => {
        
    if (ret.data()[0]["payload"]["inputs"]["password"] == signedPassword)
        {
           console.log("login good");
        }
        
         console.log(ret.data()[0]["payload"]["inputs"]);
       
        return ret.data();
    })
    .catch((error) => {
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
}



async function CreateAccount()
{
     document.body.style.cursor='wait';
  
    let username = document.getElementById("createUser").value;
    console.log(username);
    let password = document.getElementById("createPass").value;
    console.log(password);
    let repPassword = document.getElementById("repPass").value;
    var signedPassword;
     document.getElementById("createErrorText").innerHTML = "";
    if (username.length <= 0)
        {
              document.body.style.cursor='auto';  
            document.getElementById("createErrorText").innerHTML = "Username must not be blank";
            return;
        }
    if (password !=repPassword)
        {
               document.body.style.cursor='auto';  
    document.getElementById("createErrorText").innerHTML = "Password and Repeat Password must match";
            return;
        }
    if (password.length < 8)
        {
               document.body.style.cursor='auto';  
             document.getElementById("createErrorText").innerHTML = "Password must be atleast 8 characters";
            return;
        }
  
    console.log(repPassword);
      console.log(password.length);

    await GenWallet(); 
    console.log(wallet);
    console.log(wallet.getMnemonic());
    
    
    ethersWallet = ethers.Wallet.fromMnemonic(wallet.getMnemonic());
    console.log(ethersWallet);
    /*
    TODO sign password for further security
    let signPass = await wallet.sign({'data' : password});
    console.log(signPass);
   */
    
    
    if (ethersWallet)
        {
//we grab the text value from 'signInput' and run the tryParseJson function found below
    
            //that json is then signed here
    let signPromise = ethersWallet.signMessage(password.toString());
           
            
   await signPromise.then((signedTransaction)=>{
       
       console.log("Signed Transaction");
        console.log(signedTransaction);
    signedPassword = signedTransaction;
        });
        }
    else {
        //if no wallet is found this alert runs
        alert("Generate wallet before signing");
    }
    
    if (signedPassword == null)
        {
               document.body.style.cursor='auto';  
            console.log(signedPassword);
            console.log("signedpassword is nil");
            return;
        }
    
    console.log('Initialising Simba');
let simba = await libsimba.getSimbaInstance(
    'https://api.simbachain.com/v1/AuxEthTest/',
    wallet,
    'b338013bcc5aade572d1100226804d821ab03a299bdd2c9829fe4623c1c0b633');
    
    let balance = await simba.getBalance();
    console.log(balance.amount);
    
    if (balance.amount <= 0)
        {
            let result = await simba.addFunds();
            if (result.poa) {
                console.log(`Didn't add funds: PoA network. ${JSON.stringify(result)}`);
            } else if (result.faucet_url) {
                console.log(`Didn't add funds: External faucet: ${result.faucet_url} - ${JSON.stringify(result)}`);
                console.log("To top up, you need to ask the user to visit the url in `faucet_url`");
            }      else {
        console.log(`Funded - May take up to a minute for the transaction to process: ${JSON.stringify(result)}`);
            }
        }
    
    
    //Call Create Account Method
console.log('Call Create Account Method');
//These are the parameters to pass to the method call
    
    
    let getParams = {
    ethKey_exact : await wallet.getAddress()
};
var existingUser;
await simba.getMethodTransactions('account', getParams)
    .then(async (ret) => {
        
     //   console.log(ret.data());
         
        console.log(ret.data()[0]["payload"]["inputs"]);
    existingUser =  ret.data()[0]["payload"]["inputs"];
        return ret.data();
    })
    .catch((error) => {
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
    
    if (existingUser != null)
    {
        alert("Error Creating Account: Refresh the page and try again")
        return;
    }
    
    let address = await wallet.getAddress();
let methodParams = {
    assetId: "0x0",
    ethKey: address,
    password: signedPassword.toString(),
    username: username
};
//Call the `createRoom` method, with the above params. The txn is signed with the wallet we created/loaded above
await simba.callMethod('account', methodParams)
    .then(async (ret) => {
        console.log(`Successful!  ${JSON.stringify(ret)}`);
        //The request and signing were successful, now we wait for the API to
        // tell us if the txn was successful or not.
        const {
            future,
            cancel
        } = simba.waitForSuccessOrError(ret);
        //`future` is a JS Promise that will resolve when we know the status
        //`cancel` is a function, you can call it to cancel the above request if needed
        return await future
            .then(txn => {
                //txn will hold the txn details
                //txn.status will hold the status
               document.body.style.cursor='auto';  
                alert("Account Created Successfully\n12 Word Phrase: " + wallet.getMnemonic());
                 document.location.href = "index.html";
                console.log(`Status: ${txn.status}`);
                if (txn.status === 'DEPLOYED') {
                    console.log(`Hash: ${txn.transaction_hash}`);
                    
                }
            })
            .catch((error) => {
                alert("Error Logging In");
                console.error(`Failure!  ${JSON.stringify(error)}`);
            })
    })
    .catch((error) => {
     alert("Error Creating Account");
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
    
       document.body.style.cursor='auto';  
    
}



var colors = [0,1,2,3];  // Define Your colors here, can be html name of color, hex, rgb or anything what You can use in CSS
var active = 0;


setTimeout(function(){
    if (active == 0)
    {
        console.log("0");
        document.getElementById("back").style.opacity = 1;   
        document.getElementById("back1").style.opacity = 0;   
        document.getElementById("back2").style.opacity = 0;   
        document.getElementById("back3").style.opacity = 0;  
    }
    
      if (active == 1)
    {
        document.getElementById("back").style.opacity = 0;   
        document.getElementById("back1").style.opacity = 1;   
        document.getElementById("back2").style.opacity = 0;   
        document.getElementById("back3").style.opacity = 0;  
    }
    
    
      if (active == 2)
    {
        document.getElementById("back").style.opacity = 0;   
        document.getElementById("back1").style.opacity = 0;   
        document.getElementById("back2").style.opacity = 1;  
        document.getElementById("back3").style.opacity = 0;  
    }
    
      if (active == 3)
    {
        document.getElementById("back").style.opacity = 0;   
        document.getElementById("back1").style.opacity = 0;   
        document.getElementById("back2").style.opacity = 0;   
        document.getElementById("back3").style.opacity = 1;   
    }
    
    
    
   
    active++;
    if (active == colors.length) active = 0;
}, 1000);


setInterval(function(){
     if (active == 0)
    {
        console.log("0");
        document.getElementById("back").style.opacity = 1;   
        document.getElementById("back1").style.opacity = 0;   
        document.getElementById("back2").style.opacity = 0;   
        document.getElementById("back3").style.opacity = 0;  
    }
    
      if (active == 1)
    {
        document.getElementById("back").style.opacity = 0;   
        document.getElementById("back1").style.opacity = 1;   
        document.getElementById("back2").style.opacity = 0;   
        document.getElementById("back3").style.opacity = 0;  
    }
    
    
      if (active == 2)
    {
        document.getElementById("back").style.opacity = 0;   
        document.getElementById("back1").style.opacity = 0;   
        document.getElementById("back2").style.opacity = 1;  
        document.getElementById("back3").style.opacity = 0;  
    }
    
      if (active == 3)
    {
        document.getElementById("back").style.opacity = 0;   
        document.getElementById("back1").style.opacity = 0;   
        document.getElementById("back2").style.opacity = 0;   
        document.getElementById("back3").style.opacity = 1;   
    }
    
    
   
    active++;
    if (active == colors.length) active = 0;
}, 10000);


//modal view stuff
// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("createAcc");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}




