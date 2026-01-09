import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [contractInfo, setContractInfo] = useState(null);
  const [mintAmount, setMintAmount] = useState('');

  // ABI Kontrak MyToken (salin dari kontrak yang sudah di-deploy)
  const contractABI = [
    // ... ABI lengkap dari kontrak
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function mint(address to, uint256 amount)",
    "function publicMint(uint256 amount) payable",
    "function burn(uint256 amount)",
    "function getContractInfo() view returns (string, string, uint256, uint256, uint256, uint256)"
  ];

  const contractAddress = "0xYourContractAddressHere";

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        const tokenContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        setAccount(address);
        setContract(tokenContract);
        
        // Load initial data
        await loadContractInfo(tokenContract);
        await loadBalance(tokenContract, address);
        
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const loadContractInfo = async (contract) => {
    try {
      const info = await contract.getContractInfo();
      setContractInfo({
        name: info[0],
        symbol: info[1],
        totalSupply: ethers.formatEther(info[2]),
        maxSupply: ethers.formatEther(info[3]),
        mintFee: ethers.formatEther(info[4]),
        contractBalance: ethers.formatEther(info[5])
      });
    } catch (error) {
      console.error("Error loading contract info:", error);
    }
  };

  const loadBalance = async (contract, address) => {
    try {
      const balance = await contract.balanceOf(address);
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const handleMint = async () => {
    if (!contract || !mintAmount) return;
    
    try {
      const amount = ethers.parseEther(mintAmount);
      const tx = await contract.publicMint(amount, {
        value: ethers.parseEther("0.001") // Sesuaikan dengan fee
      });
      
      await tx.wait();
      alert("Mint successful!");
      await loadBalance(contract, account);
      await loadContractInfo(contract);
      
    } catch (error) {
      console.error("Error minting tokens:", error);
      alert("Mint failed: " + error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ERC20 Token Dashboard</h1>
        
        {account ? (
          <div className="wallet-info">
            <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
            <p>Balance: {balance} {contractInfo?.symbol}</p>
          </div>
        ) : (
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
        )}
      </header>

      <main className="dashboard">
        {contractInfo && (
          <div className="contract-info">
            <h2>Contract Information</h2>
            <div className="info-grid">
              <div className="info-card">
                <h3>Token Name</h3>
                <p>{contractInfo.name}</p>
              </div>
              <div className="info-card">
                <h3>Symbol</h3>
                <p>{contractInfo.symbol}</p>
              </div>
              <div className="info-card">
                <h3>Total Supply</h3>
                <p>{contractInfo.totalSupply}</p>
              </div>
              <div className="info-card">
                <h3>Max Supply</h3>
                <p>{contractInfo.maxSupply}</p>
              </div>
              <div className="info-card">
                <h3>Mint Fee</h3>
                <p>{contractInfo.mintFee} ETH</p>
              </div>
              <div className="info-card">
                <h3>Contract Balance</h3>
                <p>{contractInfo.contractBalance} ETH</p>
              </div>
            </div>
          </div>
        )}

        <div className="mint-section">
          <h2>Mint Tokens</h2>
          <div className="mint-form">
            <input
              type="number"
              placeholder="Amount to mint"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              min="0"
              step="0.1"
            />
            <button onClick={handleMint} disabled={!account}>
              Mint Tokens
            </button>
            {contractInfo && (
              <p className="fee-info">
                Fee: {ethers.formatEther(
                  ethers.parseEther(mintAmount || "0") * 
                  ethers.parseEther(contractInfo.mintFee) / 
                  ethers.parseEther("1")
                )} ETH
              </p>
            )}
          </div>
        </div>
      </main>

      <footer>
        <p>Deployed on GitHub Pages | Contract: {contractAddress}</p>
      </footer>
    </div>
  );
}

export default App;