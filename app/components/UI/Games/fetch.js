import { useMemo } from 'react';
import axios from 'axios';
import qs from 'query-string';
import Web3 from "web3"
import AppConstants from '../../../core/AppConstants';
import Logger from '../../../util/Logger';
import {worldBuild} from "./world_build"

const gamesWeb3 = new Web3(AppConstants.GAMES.WEB3);

const worldAddresses = [
    '0x8e559d60c0bdb1c2946e16f92d1c5d82b9ace25b',
    '0xb70b6dfbb7152dcb8ce938eda1d1262b8651aee8',
  ];

export function findAccountsByAddresses(addresses, callback) {
    Logger.log("数据开始")
    const batchRequest = new gamesWeb3.eth.BatchRequest();
    const { abi } = worldBuild;
    const contracts = worldAddresses.map(
      (address) => new gamesWeb3.eth.Contract(abi, address)
    );
    const accounts = [];
    const errors = [];
    let i = addresses.length * contracts.length;
    addresses.forEach((address) => {
      contracts.forEach((contract) => {
        let req = contract.methods
          .getAccountIdByAddress(address)
          .call
              .request({
              }, (err,res) => {
                Logger.log("数据返回")
                Logger.log(err,res)
                if (!err) {
                  accounts.push({
                    world: {
                      name: contract.options.address.slice(-6),
                      icon: '',
                      address: contract.options.address,
                    },
                    id: res,
                    email: '',
                    address,
                  });
                } else {
                  errors.push(err);
                }
                if (--i === 0) {
                  // callback(errors,accounts);
                  alert(JSON.stringify(accounts));
                  callback(errors, [
                    {
                      address:"0x1c534Eff630aD1598Be108C1230cbbAFb3b12EEA",
                      email:"",
                      id:"1",
                      world:{
                        address:"0x8E559d60c0bdb1C2946e16F92D1C5d82b9Ace25B",
                        icon:"",
                        name:"Ace25B"
                      }
                    },
                    {
                      address:"0x1c534Eff630aD1598Be108C1230cbbAFb3b12EEA",
                      email:"",
                      id:"1",
                      world:{
                        address:"0x8E559d60c0bdb1C2946e16F92D1C5d82b9Ace25B",
                        icon:"",
                        name:"Ace25B"
                      }
                    },
                    {
                      address:"0x1c534Eff630aD1598Be108C1230cbbAFb3b12EEA",
                      email:"",
                      id:"1",
                      world:{
                        address:"0x8E559d60c0bdb1C2946e16F92D1C5d82b9Ace25B",
                        icon:"",
                        name:"Ace25B"
                      }
                    },
                    {
                      address:"0x1c534Eff630aD1598Be108C1230cbbAFb3b12EEA",
                      email:"",
                      id:"1",
                      world:{
                        address:"0x8E559d60c0bdb1C2946e16F92D1C5d82b9Ace25B",
                        icon:"",
                        name:"Ace25B"
                      }
                    }
                  ]);
                }
              });
        batchRequest.add(req);
      });
    });
    batchRequest.execute();
  }