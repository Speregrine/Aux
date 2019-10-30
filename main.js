


    
    
    
//global variables
var wallet;
var login = false;

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
if (wallet.walletExists()) {
    //There is a local wallet, unlock it
    console.log("Unlocking Wallet");
    login = true;
    //Use this to prevent progress output spam
    let lastProgress = 0;

    await wallet.unlockWallet(
        'test1234',
        (progress) => {
            if (Math.floor(progress * 10) > lastProgress) {
                lastProgress = progress * 10;
                console.log(`Decrypting Wallet ${Math.floor(progress*100)}`);
            }
        }
    );
} else {
    login = false;
    //There is no local wallet, let
    console.log("Not Logged in");

    //Use this to prevent progress output spam
    //uncommend this out too
   // let lastProgress = 0;

   /* await wallet.generateWallet(
        'test1234',
        (progress) => {
            if (Math.floor(progress * 10) > lastProgress) {
                lastProgress = progress * 10;
                console.log(`Encrypting Wallet ${Math.floor(progress*100)}`);
            }
        });*/
    
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
 
    
}
//Print out the wallet address, you don't need to do this, but useful to see
let address = await wallet.getAddress();
console.log(`Eth Address: ${address}`);
}





async function accountInfo()
{
      await GenWallet(); 
    if (login == false)
    {
        return;
    }
    let simba = await libsimba.getSimbaInstance(
    'https://api.simbachain.com/v1/AuxEthTest/',
    wallet,
    'b338013bcc5aade572d1100226804d821ab03a299bdd2c9829fe4623c1c0b633');
    
   //Get Transactions
console.log('Get Transactions');
//These are the parameters to pass to the method call
let methodParams = {
    ethKey_exact : await wallet.getAddress()
};

await simba.getMethodTransactions('account', methodParams)
    .then(async (ret) => {
        
     //   console.log(ret.data());
          document.getElementById("signinBtn").innerHTML = "Settings";
        document.getElementById("modalUser").innerHTML = "Username: " + ret.data()[0]["payload"]["inputs"]["username"];
    login = true;
        console.log(ret.data()[0]["payload"]["inputs"]);
        return ret.data();
    })
    .catch((error) => {
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
   
}

accountInfo()

async function unlockSeed()
{
    var signedPassword;
    let ethersWallet = ethers.Wallet.fromMnemonic(wallet.getMnemonic());
       if (ethersWallet)
        {
//we grab the text value from 'signInput' and run the tryParseJson function found below
    
            //that json is then signed here
    let signPromise = ethersWallet.signMessage(document.getElementById("modalPass").value.toString());
           
            
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
    ethKey_exact : await wallet.getAddress(),
    password_exact : signedPassword 
};

await simba.getMethodTransactions('account', methodParams)
    .then(async (ret) => {
        
    if (ret.data()[0]["payload"]["inputs"]["password"] == signedPassword)
        {
            document.getElementById("modalPhrase").innerHTML = "12 word phrase: " + wallet.getMnemonic();
        }
        

        console.log(ret.data()[0]["payload"]["inputs"]);
        return ret.data();
    })
    .catch((error) => {
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
}

function gotoLogin()
{
   
    console.log("signin");
    document.location.href = "signin.html";
    
}

function signout()
{
    
    console.log("signin");
    document.location.href = "signin.html";
    
}




const names = ["Song1", "Song2"];
const authors = ["Author Person", "Another Author"];
const prices = ["16.5", "17"];
const tableItems =  [<tr class="songTable">
                     <th><span class="songTitle"><img class="icon" src="8684786ae27fbccae36e9bbc264fb6ec.jpg"/>{names[0]}</span><br/><span class="songAuthor">{authors[0]} &nbsp;&nbsp;&nbsp; {prices[0]} Lumen</span><button class="btnBuy">BUY</button></th>
                    </tr>,<tr class="songTable">
                     <th><span class="songTitle"><img class="icon" src="8684786ae27fbccae36e9bbc264fb6ec.jpg"/>{names[1]}</span><br/><span class="songAuthor">{authors[1]} &nbsp;&nbsp;&nbsp; {prices[1]} Lumen</span><button class="btnBuy">BUY</button></th>
                    </tr> ]  
// Obtain the root 
    const rootElement = document.getElementById('root')
// Create a ES6 class component    
    class SongList extends React.Component { 
// Use the render function to return JSX component      
    render() { 
        if (login)
            {
        return (
        <div>
        <table class="songTable">
                {tableItems}
                 </table>
        </div>
      );
            }
        else
            {
                return (
              <div>
        <p style={{fontSize: 1.5 + 'em'}}>Login to View Songs</p>
                    <button class="btn btn-6 btn-6a" onClick={gotoLogin}>Login</button>
        </div>  );
            }
      } 
    }
// Create a function to wrap up your component
function App(){
  return(
  <div>
    <SongList name="spaget"/>
  </div>
  )
}


// Use the ReactDOM.render to show your component on the browser
    ReactDOM.render(
      <App />,
      rootElement
    )


//modal view stuff
// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("signinBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
      if (login == false)
    {
    console.log("signin");
    document.location.href = "signin.html";
        return;
    }
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