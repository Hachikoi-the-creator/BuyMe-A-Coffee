import abi from "../utils/BuyMeACoffee.json";
import { ethers } from "ethers";
import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState } from "react";

// Contract Address & ABI
const contractAddress = "0x37c564cf66128C01f2fD05B2ce3611Fca4ee89D1";
const contractABI = abi.abi;

const createContractInstance = () => {
  const provider = new ethers.providers.Web3Provider(ethereum, "any");
  const signer = provider.getSigner();
  const buyMeCoffee = new ethers.Contract(contractAddress, contractABI, signer);
  return buyMeCoffee;
};

export default function Home() {
  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  const onNameChange = (e) => {
    setName(e.target.value);
  };

  const onMessageChange = (e) => {
    setMessage(e.target.value);
  };

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const buyCoffee = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const buyMeCoffee = createContractInstance();

        console.log("buying coffee..");
        const coffeeTxn = await buyMeCoffee.buyCoffee(
          name ? name : "Default name",
          message ? message : "Default message",
          { value: ethers.utils.parseEther("0.001") }
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const buyMeCoffee = createContractInstance();

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeCoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Send all the money from tips to deployer
  const sendAllTips = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const buyMeCoffee = createContractInstance();
        console.log("Making the owner of the contract rich...");
        await buyMeCoffee.withdrawTips();
        console.log("Done :D");
      } else {
        console.log("Metamask is not connected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeCoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name,
        },
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeCoffee = new ethers.Contract(contractAddress, contractABI, signer);

      buyMeCoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeCoffee) {
        buyMeCoffee.off("NewMemo", onNewMemo);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>Buy Hachi a Tea! 🍵</title>
        <meta name="description" content="Hachikoi's Buy me a coffe site 🍵" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container flex-column">
        <main className="main flex-column">
          <h1 className="title">Buy Hachi a Tea! 🍵</h1>
          {currentAccount ? (
            <form className="form flex-column">
              <label>Name</label>

              <input
                id="name"
                type="text"
                placeholder="Enter your nickname"
                onChange={onNameChange}
              />
              <label>Send Hachi a message~</label>

              <textarea
                rows={3}
                placeholder="Leave me a message"
                id="message"
                onChange={onMessageChange}
                required
              ></textarea>
              <button
                className="buy-btn animation-bg btn"
                type="button"
                onClick={buyCoffee}
              >
                Send 1 Coffee for 0.001ETH
              </button>
            </form>
          ) : (
            <button
              className="btn connect-btn animation-bg"
              onClick={connectWallet}
            >
              {" "}
              Connect your wallet{" "}
            </button>
          )}
        </main>

        {currentAccount && <h1>Memos received</h1>}

        {currentAccount &&
          memos.map((memo, idx) => {
            return (
              <div className="memo" key={idx}>
                <p className="memo--msg">"{memo.message}"</p>
                <p className="memo--name">
                  {" "}
                  From: {memo.name} at {memo.timestamp.toString()}
                </p>
              </div>
            );
          })}

        <footer className="footer">
          <a
            href="https://alchemy.com/?a=roadtoweb3weektwo"
            target="_blank"
            rel="noopener noreferrer"
          >
            Created by @8koi2 for Alchemy's Road to Web3 lesson two!
          </a>
          <button className="btn" onClick={sendAllTips}>
            Send tips
          </button>
        </footer>
      </div>
    </>
  );
}
