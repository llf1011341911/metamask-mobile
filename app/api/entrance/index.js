import axios from 'axios';
import AppConstants from '../../core/AppConstants';

const { GAMES_API_URL_PRODUCTION, GAMES_API_URL_STAGING } = AppConstants.GAMES;
const isDevelopment = process.env.NODE_ENV !== 'production';
const GAMES_API_BASE_URL = isDevelopment
  ? GAMES_API_URL_PRODUCTION
  : GAMES_API_URL_STAGING;

export async function requestEntrance(callback) {
    axios({
        baseURL:GAMES_API_BASE_URL,
        url:"wallet-portal/flag.json",
        method:"GET",
        headers: {
            "Content-Type": 'application/x-www-form-urlencoded',   
        }  
    
    }).then((result)=>{
        if (result != null && result.data != null && result.status == 200) {
            callback(result.data > 0);
          } else {
            callback(false);
          }
    }).catch((err)=>{
        callback(false);
    })
}
