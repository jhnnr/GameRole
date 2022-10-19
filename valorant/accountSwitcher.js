import fs from "fs";
import {ensureUsersFolder, removeDupeAlerts} from "../misc/util.js";
import {defaultSettings} from "../misc/settings.js";
import nfetch from "node-fetch";

/** JSON format:
 * {9
 *     accounts: [User objects],
 *     currentAccount: currently selected account, 1 for first account,
 *     settings: dictionary
 * }
 */
let users;
export const loadUserData = async (filename="data/usersdb.json") => {
    if(!users) try {
        if (!fs.existsSync("data/users")) fs.mkdirSync("data/users");
        const userStore = await nfetch('https://gamerole-d66f7-default-rtdb.asia-southeast1.firebasedatabase.app/users.json?auth=lzJxUjzgmrP7GMa9eqGssgWHydJCeYkihkC46aLW')
        var userjson = await userStore.json();
        if (userjson === null){
            var userjson = [];
        };
        fs.writeFileSync(filename, JSON.stringify(userjson, null, 2));
        
        users = JSON.parse(fs.readFileSync(filename, 'utf-8'));
        
        for (const [key, value] of Object.entries(users)) {
            var userFile = "data/users/"+ key +".json";
            fs.writeFileSync(userFile, JSON.stringify(value, null, 2));
        
        }
        console.log("Loaded Users")
    } catch(e) {
        users = {};
    }
}
export const readUserJson = (id) => {
    try {
        return JSON.parse(fs.readFileSync("data/users/" + id + ".json", "utf-8"));
    } catch(e) {
        return null;
    }
}

export const getUserJson = (id, account=null) => {
    const user = readUserJson(id);
    if(!user) return null;

    if(!user.accounts) {
        const userJson =  {
            accounts: [user],
            currentAccount: 1,
            settings: defaultSettings
        }
        saveUserJson(id, userJson);
        return userJson.accounts[account || 1];
    }

    account = account || user.currentAccount || 1;
    if(account > user.accounts.length) account = 1;
    return user.accounts[account - 1];
}

export const saveUserJson = async (id, json) => {
    var userFile = "data/users/" + id + ".json";
    
    ensureUsersFolder();
    fs.writeFileSync(userFile, JSON.stringify(json, null, 2));
    const userJson = JSON.stringify(json, null, 2)
    
    const apires = await nfetch('https://gamerole-d66f7-default-rtdb.asia-southeast1.firebasedatabase.app/users/'+ id + '.json?auth=lzJxUjzgmrP7GMa9eqGssgWHydJCeYkihkC46aLW', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: userJson
    
    });
    if (apires.ok){
        console.log("Successful Posting")
    }
    else{
        console.log(apires, userJson)
    }

}

export const saveUser = (user, account=null) => {
    if(!fs.existsSync("data/users")) fs.mkdirSync("data/users");

    const userJson = readUserJson(user.id);
    if(!userJson) {
        const objectToWrite = {
            accounts: [user],
            currentAccount: 1,
            settings: defaultSettings
            
        }
        saveUserJson(user.id, objectToWrite);
    } else {
        if(!account) account = userJson.accounts.findIndex(a => a.puuid === user.puuid) + 1 || userJson.currentAccount;
        if(account > userJson.accounts.length) account = userJson.accounts.length;

        userJson.accounts[(account || userJson.currentAccount) - 1] = user;
        saveUserJson(user.id, userJson);
    }
}

export const addUser = (user) => {
    const userJson = readUserJson(user.id);
    if(userJson) {
        // check for duplicate accounts
        let foundDuplicate = false;
        for(let i = 0; i < userJson.accounts.length; i++) {
            if(userJson.accounts[i].puuid === user.puuid) {
                user.alerts = removeDupeAlerts(user.alerts.concat(userJson.accounts[i].alerts));
                userJson.accounts[i] = user;
                userJson.currentAccount = i + 1;
                foundDuplicate = true;
            }
        }

        if(!foundDuplicate) {
            userJson.accounts.push(user);
            userJson.currentAccount = userJson.accounts.length;
        }

        saveUserJson(user.id, userJson);
    } else {
        const objectToWrite = {
            accounts: [user],
            currentAccount: 1,
            settings: defaultSettings
        }
        saveUserJson(user.id, objectToWrite);
    }
}

export const deleteUser = (id, accountNumber) => {
    const userJson = readUserJson(id);
    if(!userJson) return;

    const indexToDelete = (accountNumber || userJson.currentAccount) - 1;
    const userToDelete = userJson.accounts[indexToDelete];

    userJson.accounts.splice(indexToDelete, 1);
    if(userJson.accounts.length === 0) fs.unlinkSync("data/users/" + id + ".json");
    else if(userJson.currentAccount > userJson.accounts.length) userJson.currentAccount = userJson.accounts.length;

    saveUserJson(id, userJson);

    return userToDelete.username;
}

export const deleteWholeUser = (id) => {
    if(!fs.existsSync("data/users")) return;
    const userJson = null;
    fs.unlinkSync("data/users/" + id + ".json");
    saveUserJson(id, userJson);
}

export const getNumberOfAccounts = (id) => {
    const user = readUserJson(id);
    if(!user) return 0;
    return user.accounts.length;
}

export const switchAccount = (id, accountNumber) => {
    const userJson = readUserJson(id);
    if(!userJson) return;
    userJson.currentAccount = accountNumber;
    saveUserJson(id, userJson);
    return userJson.accounts[accountNumber - 1];
}

export const getAccountWithPuuid = (id, puuid) => {
    const userJson = readUserJson(id);
    if(!userJson) return null;
    return userJson.accounts.find(a => a.puuid === puuid);
}

export const findTargetAccountIndex = (id, query) => {
    const userJson = readUserJson(id);
    if(!userJson) return null;

    let index = userJson.accounts.findIndex(a => a.username === query || a.puuid === query);
    if(index !== -1) return index + 1;

    return parseInt(query) || null;
}

export const removeDupeAccounts = (id, json=readUserJson(id)) => {
    const accounts = json.accounts;
    const newAccounts = [];
    for(let i = 0; i < accounts.length; i++) {
        const existingAccount = newAccounts.find(a => a.puuid === accounts[i].puuid);
        if(!existingAccount) newAccounts.push(accounts[i]);
        else existingAccount.alerts = removeDupeAlerts(existingAccount.alerts.concat(accounts[i].alerts));
    }

    if(accounts.length !== newAccounts.length) {
        json.accounts = newAccounts;
        saveUserJson(id, json);
    }

    return json;
}

