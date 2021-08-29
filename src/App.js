import * as React from "react";
import { ethers } from "ethers";
import "./App.css";
import abiObj from "./utils/WavePortal.json";
import bottle from "./seabottle.jpg";

export default function App() {
  // Just a state variable we use to store our user's public wallet address
  const [currAccount, setCurrentAccount] = React.useState("");
  const contractAddress = "0x1125Bfc01daeaa3a9Ef1D0E3009c43DAA973F049";

  const contractABI = abiObj.abi;
  const [covidMessage, setCovidMessage] = React.useState("");

  const checkIfWalletIsConnected = () => {
    // First make sure we have access to window.ethereum
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    // Check if we're authorized to access the user's wallet
    ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      // We could have multiple accounts. Check for one.
      if (accounts.length !== 0) {
        // Grab the first account we have access to.
        const account = accounts[0];
        console.log("Found an authorized account: ", account);

        // Store the users public wallet address for later!
        setCurrentAccount(account);

        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    });
  };

  const connectWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("Get metamask!");
    }

    ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        console.log("Connected", accounts[0]);
        setCurrentAccount(accounts[0]);
      })
      .catch((err) => console.log(err));
  };

  // This runs our function when the page loads.
  React.useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const wave = async (message) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const waveportalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    let count = await waveportalContract.getTotalWaves();
    console.log("Retrieved total wave count...", count.toNumber());

    const waveTxn = await waveportalContract.wave(message, {
      gasLimit: 300000,
    });
    console.log("Mining...", waveTxn.hash);
    await waveTxn.wait();
    console.log("Mined -- ", waveTxn.hash);

    count = await waveportalContract.getTotalWaves();
    console.log("Retrieved total wave count...", count.toNumber());
  };

  const [allWaves, setAllWaves] = React.useState([]);
  async function getAllWaves() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const waveportalContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    let waves = await waveportalContract.getAllWaves();

    let wavesCleaned = [];
    waves.forEach((wave) => {
      wavesCleaned.push({
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message,
      });
    });

    setAllWaves(wavesCleaned.reverse());

    waveportalContract.on("NewWave", (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((oldArray) => [
        ...oldArray,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (covidMessage) {
      wave(covidMessage);
      setCovidMessage("");
    } else {
      console.log("You haven't entered a covid message!");
    }
  };

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">Pandemic in a Bottle ✉️🍾</div>

        <div className="bio">
          What is the one key insight you want future generations 100+ years
          from now to know, about how humans have dealt with the COVID-19
          pandemic?
          <br />
          <br />
          Your message will be stored forever on the Ethereum blockchain, so
          make it count.
        </div>

        {currAccount ? (
          <form className="form" onSubmit={handleSubmit}>
            <textarea
              type="text"
              placeholder="Enter message to future generations"
              id="covidMessage"
              className="covidMessage"
              name="covidMessage"
              value={covidMessage}
              onChange={(e) => setCovidMessage(e.target.value)}
              required
            ></textarea>

            <button className="waveButton">Wave Goodbye to Covid 👋</button>
          </form>
        ) : (
          <button className="connectWalletButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div className="messageContainer">
              <div className="messageImageContainer">
                <div className="avatarImageWrapper">
                  <img src={bottle} className="avatarImage"></img>
                </div>
              </div>
              <div className="messageDetailsContainer">
                <div className="address">Address: {wave.address}</div>
                <div className="time">Time: {wave.timestamp.toString()}</div>
                <div className="storedMessage">Message: {wave.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
