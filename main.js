


    
    
    
//global variables
var wallet;
var login = false;
var userName;
var globalFiles;
var thumbnail;
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
    getTableItems()
    let simba = await libsimba.getSimbaInstance(
    'https://api.simbachain.com/v1/AuxEthTest/',
    wallet,
    '73b76aa3969ffaa463000e6618b4c2d3871e7e764f392df0461c7d0c878574ab');
    
   //Get Transactions
console.log('Get Transactions');
//These are the parameters to pass to the method call
let methodParams = {
    ethKey_exact : await wallet.getAddress()
};

await simba.getMethodTransactions('account', methodParams)
    .then(async (ret) => {
        
     //   console.log(ret.data());
          document.getElementById("signinBtn").innerHTML = "Account";
        document.getElementById("modalUser").innerHTML = "Username: " + ret.data()[0]["payload"]["inputs"]["username"];
    userName = ret.data()[0]["payload"]["inputs"]["username"];
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
    '73b76aa3969ffaa463000e6618b4c2d3871e7e764f392df0461c7d0c878574ab');
    
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

async function uploadSong()
{
    //Get parameters from input
    let title =  document.getElementById('uploadTitle').value;
    let author =  document.getElementById('uploadAuthor').value;
    let genre =  document.getElementById('uploadGenre').value;
    let price =  document.getElementById('uploadPrice').value;
    let file = globalFiles;
    
    
    console.log(title);
    console.log(author);
    console.log(genre);
    console.log(price);
    console.log(file);
    
    
    //Initialize Simba
      let simba = await libsimba.getSimbaInstance(
    'https://api.simbachain.com/v1/AuxEthTest/',
    wallet,
    '73b76aa3969ffaa463000e6618b4c2d3871e7e764f392df0461c7d0c878574ab');
    //Upload Song
     //get timestamp
        var dateRaw = new Date();
        var date = dateRaw.toString();
    console.log(date);
        //generate uniqueID
        var uniqueID = userName.substr(0,2) + Math.round((dateRaw.getMilliseconds() + Math.random()) * 1000000000000).toString();
    console.log(uniqueID);
       //define parameters
        let address = await wallet.getAddress();
let methodParams = {
    assetId: "0x0",
    name: title,
    album: "null",
    genre: genre,
    price: price,
    author: author,
    uniqueid: uniqueID,
    timestamp: date
};

await simba.callMethod('Song', methodParams, file)
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
                alert("Song Uploaded");
                 
                console.log(`Status: ${txn.status}`);
                if (txn.status === 'DEPLOYED') {
                    console.log(`Hash: ${txn.transaction_hash}`);
                    
                }
            })
            .catch((error) => {
                alert("Error Uploading Song");
                console.error(`Failure!  ${JSON.stringify(error)}`);
            })
    })
    .catch((error) => {
     alert("Error Uploading Song");
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
    //Upload Thumbnail
  //  console.log(thumbnail);
   let thumbParams = {
    assetId: "0x0",
    uniqueId: uniqueID
};

await simba.callMethod('Thumbnail', thumbParams, thumbnail)
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
                alert("Thumbnail Uploaded");
               
                console.log(`Status: ${txn.status}`);
                if (txn.status === 'DEPLOYED') {
                    console.log(`Hash: ${txn.transaction_hash}`);
                    
                }
            })
            .catch((error) => {
                alert("Error Uploading Thumbnail");
                console.error(`Failure!  ${JSON.stringify(error)}`);
            })
    })
    .catch((error) => {
     alert("Error Uploading Thumbnail");
        console.error(`Failure!  ${JSON.stringify(error)}`);
    }); 
    
    
}




var tableItems = [];  /*[<tr class="songTable">
                     <th><span class="songTitle"><img class="icon" src="8684786ae27fbccae36e9bbc264fb6ec.jpg"/>{names[0]}</span><br/><span class="songAuthor">{authors[0]} &nbsp;&nbsp;&nbsp; {prices[0]} Lumen</span><button class="btnBuy">BUY</button></th>
                    </tr>,<tr class="songTable">
                     <th><span class="songTitle"><img class="icon" src="8684786ae27fbccae36e9bbc264fb6ec.jpg"/>{names[1]}</span><br/><span class="songAuthor">{authors[1]} &nbsp;&nbsp;&nbsp; {prices[1]} Lumen</span><button class="btnBuy">BUY</button></th>
                    </tr> ]  */

var count;
var songinfo;
var songthumbnaildata;
async function getTableItems()
{
    if (login)
        {
            console.log(wallet);
               let simba = await libsimba.getSimbaInstance(
    'https://api.simbachain.com/v1/AuxEthTest/',
    wallet,
    '73b76aa3969ffaa463000e6618b4c2d3871e7e764f392df0461c7d0c878574ab');
    let methodParams = {
   
};
            await simba.getMethodTransactions('Song', methodParams)
                .then(async (ret) => {
        
          console.log(ret.data());
                console.log(ret.data().length);
        songinfo = ret.data();
        count = ret.data().length;    
      //  console.log(songinfo);
        return ret.data();
    })
    .catch((error) => {
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
            
     await simba.getMethodTransactions('Thumbnail', methodParams)
                .then(async (ret) => {
        
          console.log(ret.data());
                console.log(ret.data().length);
            songthumbnaildata = ret.data() 
      //  console.log(songinfo);
        return ret.data();
    })
    .catch((error) => {
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });       
            var i = 0
            var song;
         for (song in songinfo)
             {
                 tableItems[i] = <tr class="songTable"><th><span class="songTitle"><img class="icon" src="8684786ae27fbccae36e9bbc264fb6ec.jpg"/>{songinfo[i]["payload"]["inputs"]["name"]}</span><br/><span class="songAuthor">{songinfo[i]["payload"]["inputs"]["author"]} &nbsp;&nbsp;&nbsp; {songinfo[i]["payload"]["inputs"]["price"]} Lumen</span><button class="btnBuy">BUY</button></th></tr>
                 i +=1;
             }
            var thumb;
            i = 0;
         for (thumb in songthumbnaildata)
         {
             console.log(thumb);
            var transactionId = thumb["id"];
                                await simba.getFileFromBundleForTransaction(transactionId, 0, false)
    .then(async (blob) => {
        //This returns a Blob object. In Node
        console.log(`Successful!`);
        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";

        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = 'File1.png';
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
        console.error(`Failure!  ${JSON.stringify(error)}`);
    });
             i +=1
         }
         
            ReactDOM.render(
      <App />,
      rootElement
    )
        }   
}

// Obtain the root 
    const rootElement = document.getElementById('root')
// Create a ES6 class component    
    class SongList extends React.Component { 
    updateList()
        {
            this.forceUpdate();
        }
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

                
                
 function GetFile()
{
       var files = event.target.files;
    globalFiles = files[0];
   var filename = files[0].name;
   var extension = files[0].type;
       console.log(extension);
    console.log(filename);
    if (extension != "audio/mp3")
        {
            alert("Please only upload mp3 files");
            document.getElementById("myFile").setAttribute("type","text");
            document.getElementById("myFile").setAttribute("type","file");
        }
    
}               
                  
 function GetThumbnail()
{
       var files = event.target.files;
    thumbnail = files[0];
   var filename = files[0].name;
   var extension = files[0].type;
       console.log(extension);
    console.log(filename);
   
    
}               
                
                

//modal view stuff
// Get the modal
var modal = document.getElementById("myModal");
var uploadModal = document.getElementById("uploadModal");
// Get the button that opens the modal
var btn = document.getElementById("signinBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

var uploadbtn = document.getElementById("uploadbtn");                
                
uploadbtn.onclick = function() {
  modal.style.display = "none";  
  uploadModal.style.display = "block";
}               
                
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
     uploadModal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
       uploadModal.style.display = "none";
  }
}
