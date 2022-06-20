import Web3 from 'web3';

const urlToWeb3 = new Map();

export function getWeb3(url) {
  let web3 = urlToWeb3.get(url);
  if (web3) {
    return web3;
  }
  web3 = new Web3(url);
  urlToWeb3.set(url, web3);
  return web3;
}