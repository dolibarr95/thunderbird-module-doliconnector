import * as DOMPurify from './vendors/DOMPurify/purify.min.js';

export async function checkConfig(){

    let configData = await browser.storage.local.get({dolibarrApiKey:'', dolibarrApiUrl:''});


    let apiKey = configData.dolibarrApiKey;
    let dolUrl = configData.dolibarrApiUrl;

    if(apiKey.length == 0 || dolUrl ==0 ){  return false; }

    return true;
}

export async function callDolibarrApi(endPoint, getDataParam, type = 'GET', postData, successCallBackFunction = ()=>{}, errorCallBackFunction = ()=>{}){

    let configData = await browser.storage.local.get({dolibarrApiKey:'', dolibarrApiUrl:''});


    let apiKey = configData.dolibarrApiKey;
    let dolUrl = configData.dolibarrApiUrl;

    if(apiKey.length == 0 || dolUrl ==0 ){  reject("Fail getting settings"); }
    if(dolUrl.slice(-1) != '/'){ dolUrl = dolUrl + '/';  }
    let dolApiUrl = dolUrl + 'api/index.php/';
    let finalUrl = dolApiUrl + endPoint;

    if(type == 'GET'){
        let queryString = Object.keys(getDataParam).map((key) => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(getDataParam[key])
        }).join('&');

        if(queryString.length>0){
            finalUrl = finalUrl + '?' + queryString;
        }
    }


    let xhttp = new XMLHttpRequest();
    xhttp.open(type, finalUrl, true);
    xhttp.setRequestHeader("DOLAPIKEY", apiKey);
    xhttp.onreadystatechange = function()
    {
        if (this.readyState == XMLHttpRequest.DONE && this.status == 200)
        {
            let responseJsonObj = JSON.parse(this.responseText);

            if (typeof successCallBackFunction === 'function') {
                successCallBackFunction(responseJsonObj);
            } else {
                console.error('Callback function invalide for callKanbanInterface');
            }
        }else if (this.readyState == XMLHttpRequest.DONE){
            let errorMsg = '' ;
            var statusErrorMap = {
                '404' : "Not found",
                '400' : "Server understood the request, but request content was invalid.",
                '401' : "Unauthorized access.",
                '403' : "Forbidden resource can't be accessed.",
                '500' : "Internal server error.",
                '503' : "Service unavailable."
            };
            if (this.status) {
                errorMsg = statusErrorMap[this.status];
                if(!errorMsg){
                    errorMsg = "Unknown Error \n.";
                }
            }

            if (typeof errorCallBackFunction === 'function') {
                errorCallBackFunction(errorMsg);
            } else {
                console.error('Error Callback function invalide for callKanbanInterface');
            }
        }
    };

    xhttp.send( postData );
    return xhttp;
}


export function extractEmailAddressFromString(text){
    // Expression régulière pour rechercher les adresses e-mail
    let emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;

    // Utilisation de la méthode match() pour obtenir un tableau contenant toutes les correspondances trouvées
    let emails = text.match(emailRegex);

    // Retourner le tableau d'adresses e-mail
    return emails;
}


export async function getDolibarrUrl() {
    let configData = await messenger.storage.local.get({
        dolibarrApiUrl: '',
        dolibarrApiKey: '',
    });

    let apiKey = configData.dolibarrApiKey;
    let dolUrl = configData.dolibarrApiUrl;


    if(dolUrl.length > 0 && dolUrl.slice(-1) != '/'){ dolUrl = dolUrl + '/';  }
    return dolUrl;
}


// function getAllStorageSyncData(top_key) {
//     // Immediately return a promise and start asynchronous work
//     return new Promise((resolve, reject) => {
//         // Asynchronously fetch all data from storage.sync.
//         browser.storage.local.get(top_key, (items) => {
//             // Pass any observed errors down the promise chain.
//             if (browser.runtime.lastError) {
//                 return reject(browser.runtime.lastError);
//             }
//             // Pass the data retrieved from storage down the promise chain.
//             resolve(items);
//         });
//     });
// }



function replace_i18n(obj, tag) {
    var msg = tag.replace(/__MSG_(\w+)__/g, function(match, v1) {
        return v1 ? chrome.i18n.getMessage(v1) : '';
    });

    if(msg != tag) obj.innerHTML = msg;
}

export function localizeHtmlPage() {
    // Localize using __MSG_***__ data tags
    var data = document.querySelectorAll('[data-localize]');

    for (var i in data) if (data.hasOwnProperty(i)) {
        var obj = data[i];
        var tag = obj.getAttribute('data-localize').toString();

        replace_i18n(obj, tag);
    }

    // Localize everything else by replacing all __MSG_***__ tags
    var page = document.getElementsByTagName('html');

    for (var j = 0; j < page.length; j++) {
        var obj = page[j];
        var tag = obj.innerHTML.toString();

        replace_i18n(obj, tag);
    }
}

/**
 *
 * @param fullName
 * @returns {{}}
 */
export function parseName(fullName) {
    const name = fullName.split(' ')
    const person = {}
    if (name.length > 1) {
        // check if name is first element
        if(name[0] === name[0].toUpperCase()){
            person.firstName = name.pop()
            person.lastName = name.join(' ')
        }else{
            person.lastName = name.pop()
            person.firstName = name.join(' ')
        }

    } else {
        person.lastName = ""
        person.firstName = obj.name
    }

    return person
}

export function parseHTML(html) {
    var t = document.createElement('template');
    t.innerHTML = html;//DOMPurify.sanitize(html);
    return t;
}

/**
 *
 * @param stringToParse
 */
export function searchPhonesInString(stringToParse, stringIsHtml = false){

    // if(stringToParse == undefined){
    //     return [];
    // }

    if(stringIsHtml){
        return searchPhonesInDom(parseHTML(stringToParse));
    }

    let matchPhoneNumbers = [];
    let phoneNumbers = [];
    const regexp = new RegExp("(?:(?:(?:\\+|00)33[ ]?(?:\\(0\\)[ ]?)?)|0){1}[1-9]{1}([ .-]?)(?:\\d{2}\\1?){3}\\d{2}$","gm");
    matchPhoneNumbers = [...stringToParse.matchAll(regexp)];
    for (const match of matchPhoneNumbers) {
        phoneNumbers.push(match[0]);
    }

    return phoneNumbers;
}


/**
 *
 * @param {HTMLElement} el
 */
export function searchPhonesInDom(el){

    let phonesNumbers = [];

    let links = document.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        let link = links[i];
        if (link.href.startsWith('tel:')) {
            let phone = link.href
            // TODO : Format phone number before push
            phonesNumbers.push(phone);
        }
    }

    if(phonesNumbers.length == 0){
        phonesNumbers = searchPhonesInString(el.textContent);
    }

    return phonesNumbers;
}

export function cleanPhoneNumber(string){
    return string.replace(/[\(\)\s\-]/g, '');
}


export async function getMessageBody(id){
    let messageBody = await messenger.messages.getFull(id);
    if(!messageBody){
        return false;
    }

    let obj = {
      html: '',
      txt: '',
    };


    let multipart = messageExtractMultipart(messageBody);

    if(multipart){
        multipart.parts.forEach((item) => {
            if(item.contentType == "text/html"){
                obj.html = item.body;
            }else if(item.contentType == "text/plain"){
                obj.txt = item.body;
            }
        });
    }


    return obj;
}

function messageExtractMultipart(item){

    if(item.hasOwnProperty('contentType') && item.contentType == "multipart/alternative"){
        return item;
    }

    let find = false;

    if(item.hasOwnProperty('parts')){
        item.parts.forEach((subItem) => {
            let subExtract = messageExtractMultipart(subItem);
            if(subExtract !== false){
                find = subExtract;
                return ;
            }
        });
    }

    return find;
}

/**
 * Function to convert JSON data to HTML table
 * @param {} JsonTitle
 * @param {} jsonData
 * @param {HTMLElement} container
 */
export function jsonToTable(JsonTitle, jsonData, container, tableClass = 'dolibarr-table dolibarr-table-stripped'){

    let appendToTable = false;

    if(container.tagName == 'table' ){
        appendToTable = true;
    }

    // Create the table element
    let table  = document.createElement("table");
    if(tableClass.length > 0) {
        table.classList.add(...tableClass.split(" "));
    }




    // Get the keys (column names) of the first object in the JSON data
    let cols = Object.values(JsonTitle);

    // Create the header element
    let thead = document.createElement("thead");
    let tr = document.createElement("tr");
    tr.classList.add('table-title');

    // Loop through the column names and create header cells
    cols.forEach((item) => {
        let th = document.createElement("th");
        th.textContent = item; // Set the column name as the text of the header cell
        tr.appendChild(th); // Append the header cell to the header row
    });
    thead.appendChild(tr); // Append the header row to the header

    if(appendToTable) {
        table.appendChild(tr);  // Append the header to the table
    }
    else{
        container.appendChild(tr);  // Append the header to the table
    }


    // Loop through the JSON data and create table rows
    jsonData.forEach((item) => {
        let tr = document.createElement("tr");

        // Get the values of the current object in the JSON data
        let vals = Object.values(item);

        // Loop through the values and create table cells
        vals.forEach((elem) => {
            let td = document.createElement("td");

            if(typeof elem === 'object' && elem !== null){
                td.innerHTML = elem.html; //DOMPurify.sanitize(elem.html); // Set the value as the text of the table cell

                if(Object.hasOwn(elem, 'class') ){
                    td.classList.add(...elem.class.split(" "));
                }
            }
            else{
                td.textContent = elem; // Set the value as the text of the table cell
            }


            tr.appendChild(td); // Append the table cell to the table row
        });

        if(appendToTable) {
            table.appendChild(tr); // Append the table row to the table
        }
        else{
            container.appendChild(tr); // Append the table row to the table
        }
    });

    if(!appendToTable) {
        container.appendChild(table) // Append the table to the container element
    }
}