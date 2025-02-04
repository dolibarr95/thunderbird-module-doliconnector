import * as dolLib from '../global.lib.js';
import {searchPhonesInString} from "../global.lib.js";

    // first need to translate page before add dom events
    dolLib.localizeHtmlPage();

    // The user clicked our button, get the active tab in the current window using
    // the tabs API.
    let tabs = await messenger.tabs.query({ active: true, currentWindow: true });

    // Get the message currently displayed in the active tab, using the
    // messageDisplay API. Note: This needs the messagesRead permission.
    // The returned message is a MessageHeader object with the most relevant
    // information.
    let message = await messenger.messageDisplay.getDisplayedMessage(tabs[0].id);
    let messageBody = await dolLib.getMessageBody(message.id);

    // Request the full message to access its full set of headers.
    // let full = await messenger.messages.getFull(message.id);
    // document.getElementById("received").textContent = full.headers.received[0];

    let checkConfig = await dolLib.checkConfig();

    // Extract email from author
    let authorEmail = dolLib.extractEmailAddressFromString(message.author)[0];

    let confDolibarUrl = await dolLib.getDolibarrUrl();


    if(!checkConfig){
        displayTpl("check-module-config");
    }else{
        displayTpl("main-popup");



        // Get contact infos

        dolLib.callDolibarrApi('contacts', {
            limit : 5,
            sortfield: 't.rowid',
            sortorder: 'DESC',
            sqlfilters: "(t.email:like:'"+authorEmail+"')"
        }, 'GET', {}, (resData)=>{

            resData = resData.pop();
            // Populate company data
            setSocInfos({
                id: resData.socid,
                name: resData.socname
            });

            loadDocumentsInfos({
                socId : resData.socid
            })

        },(errorMsg)=>{
            console.log("contacts not found now search Thirdparties And Populate By Email " + authorEmail);
            searchThirdpartiesAndPopulateByEmail(authorEmail);
        });


    }


    function searchThirdpartiesAndPopulateByEmail(authorEmail){
        // console.error(msg);
        dolLib.callDolibarrApi('thirdparties', {
            limit : 1,
            sortfield: 't.rowid',
            sortorder: 'DESC',
            sqlfilters: "(t.email:like:'"+authorEmail+"')"
        }, 'GET', {}, (resData)=>{
            console.log("searchThirdpartiesAndPopulateByEmail found ");
            resData = resData.pop();
            // Populate company data
            setSocInfos({
                id: resData.id,
                name: resData.name
            });

            loadDocumentsInfos({
                socId : resData.id
            })

        },(errorMsg)=>{
            console.log("thirdpartie  not found now search Thirdparties And Populate By Email domain " + authorEmail);
            searchThirdpartieAndPopulateByEmailDomain(authorEmail);
        });
    }

    function searchThirdpartieAndPopulateByEmailDomain(authorEmail){
        console.log("search for same domain soc");

        // TODO check if email domain isn't in FAI list
        let emailPulbicDomains = [
            'google.com','live.fr', 'live.com', 'orange.fr','yopmail.com',
            "orange.fr", "hotmail.fr", "wanadoo.fr", "free.fr", "yahoo.fr",
            "hotmail.com", "sfr.fr", "laposte.net", "outlook.fr", "live.fr",
            "neuf.fr", "aol.com", "yahoo.com", "bbox.fr", "icloud.com",
            "outlook.com", "msn.com", "cegetel.net",
            "club-internet.fr", "gmx.fr", "aliceadsl.fr", "me.com",
            "numericable.fr", "nordnet.fr", "protonmail.com",
            "ymail.com", "hotmail.be", "9online.fr","live.be",
            "libertysurf.fr", "live.com", "skynet.be", "gmail.fr", "aol.fr"

        ]

        let emailDomain = authorEmail.split('@').pop();

        if(!emailPulbicDomains.includes(emailDomain.toLowerCase())){
            console.log("not public email " + emailDomain);

            // console.error(msg);
            dolLib.callDolibarrApi('thirdparties', {
                limit : 5,
                sortfield: 't.rowid',
                sortorder: 'DESC',
                sqlfilters: "(t.email:like:'%@"+emailDomain+"')"
            }, 'GET', {}, (resData)=>{
                resData = resData.pop();
                console.log("searchThirdpartieAndPopulateByEmailDomain found ");
                // Populate company data
                setSocInfos({
                    id: resData.id,
                    name: resData.name
                });

                loadDocumentsInfos({
                    socId : resData.id
                })

            },(errorMsg)=>{
                console.log("not found ");
                setSocInfos({});
            });

        }else{
            setSocInfos({});
        }
    }



    /**
     * Display company data
     * @param socData
     */
    async function setSocInfos(socData){
        let soc = Object.assign({
            id: 0,
            name: '',
            phone_pro : '',
            phone_perso : '',
            phone_mobile : ''

        }, socData);

        // Add soc link
        let linkSociete= document.getElementById("soc-link");
        let titleDiv =  document.getElementById("popup-header");

        // console.log(message);

        if(soc.id == 0){
            displayTpl("soc-not-found-tpl");

            let newSocieteLink= document.getElementById("new-soc-link");
            let newContactLink= document.getElementById("new-contact-link");

            // societe not found
            soc.name = message.author.replace(authorEmail,'');
            soc.name = soc.name.replace(/[^a-zA-Z0-9 ]/g, '');
            soc.name = soc.name.trim();

            // let phones = dolLib.searchPhonesInString(messageBody.html, true);
            let phones = dolLib.searchPhonesInString(messageBody.txt);
            if(phones.length>0){
                soc.phone_pro = phones[0];
            }
            if(phones.length>1){
                // TODO detect who is mobile
                soc.phone_mobile = phones[1];
            }
            if(phones.length>2){
                soc.phone_perso = phones[2];
            }



            let newThirdURL = new URL(confDolibarUrl + "societe/card.php");
            newThirdURL.searchParams.set('action', "create");
            newThirdURL.searchParams.set('email', authorEmail);
            newThirdURL.searchParams.set('name', soc.name);
            newThirdURL.searchParams.set('phone',  soc.phone_pro);
            newSocieteLink.href = newThirdURL;

            titleDiv.textContent =  soc.name;

            let newContactURL = new URL(confDolibarUrl + "contact/card.php");
            newContactURL.searchParams.set('action', "create");
            newContactURL.searchParams.set('email', authorEmail);
            newContactURL.searchParams.set('firstname', dolLib.parseName(soc.name).firstName);
            newContactURL.searchParams.set('lastname', dolLib.parseName(soc.name).lastName);
            newContactURL.searchParams.set('phone_pro',  soc.phone_pro);
            newContactURL.searchParams.set('phone_mobile',  soc.phone_mobile);
            newContactURL.searchParams.set('phone_perso',  soc.phone_perso);
            newContactLink.href = newContactURL;


            return;
        }

        displayTpl("soc-link");

        titleDiv.textContent =  soc.name;
        let url = new URL(confDolibarUrl + "societe/card.php");
        url.searchParams.set('socid', soc.id);
        linkSociete.href = url;

    }


    /**
     * display propal history
     * @param object confData
     */
    function setQuotationsInfos(confData){
        let conf = Object.assign({
            socId: 0
        }, confData);

        // Get contact infos
        return dolLib.callDolibarrApi('proposals', {
            sortfield: 't.rowid',
            sortorder: 'DESC',
            limit:5,
            thirdparty_ids: conf.socId
        }, 'GET', {}, (dataLastPropals)=>{

            if(!Array.isArray(dataLastPropals) || dataLastPropals.length == 0){
                // No contact found in database
                return;
            }

            let tableItems = [];
            dataLastPropals.forEach((propal) => {

                let item = {
                    'ref': '',
                    'refClient': '',
                    'date': '',
                    'total_ht': ''
                }

                item.ref = {
                    html: '<a href="'+ confDolibarUrl + 'comm/propal/card.php?id=' + propal.id+'" >' + propal.ref + '</a>'
                };

                if(propal.ref_client.length > 0){
                    item.refClient = {
                        html: propal.ref_client
                    };
                }

                let dateP = new Date(parseInt(propal.date) * 1000);
                item.date = {
                    html: dateP.toLocaleDateString()
                };

                item.total_ht = {
                    html: new Intl.NumberFormat([], {
                            style: 'currency',
                            currency: propal.multicurrency_code
                        }).format(parseFloat(propal.total_ht)),
                    class: 'text-right'
                };
                tableItems.push(item);
            });

            dolLib.jsonToTable(
                {
                    'ref': chrome.i18n.getMessage('Ref'),
                    'refClient': chrome.i18n.getMessage('RefClient'),
                    'date': chrome.i18n.getMessage('Date'),
                    'total_ht': chrome.i18n.getMessage('Total')
                },
                tableItems,
                document.getElementById("data-from-dolibarr")
            );


        },(errorMsg)=>{
            console.error("setQuotationsInfos" + errorMsg);
        });

    }


    /**
     * display propal history
     * @param object confData
     */
    function setOrdersInfos(confData){
        let conf = Object.assign({
            socId: 0
        }, confData);

        // Get contact infos
        return dolLib.callDolibarrApi('orders', {
            sortfield: 't.rowid',
            sortorder: 'DESC',
            limit:5,
            thirdparty_ids: conf.socId
        }, 'GET', {}, (dataLastOrders)=>{

            if(!Array.isArray(dataLastOrders) || dataLastOrders.length == 0){
                // No contact found in database
                return;
            }

            let tableItems = [];
            dataLastOrders.forEach((order) => {

                let item = {
                    'ref': '',
                    'refClient': '',
                    'date': '',
                    'total_ht': ''
                }

                item.ref = {
                    html: '<a href="'+ confDolibarUrl + 'commande/card.php?id=' + order.id+'" >' + order.ref + '</a>'
                };

                if(order.ref_client.length > 0){
                    item.refClient = {
                        html:  order.ref_client
                    };
                }

                let dateP = new Date(parseInt(order.date) * 1000);
                item.date = {
                    html: dateP.toLocaleDateString()
                };

                item.total_ht = {
                    html: new Intl.NumberFormat([], {
                        style: 'currency',
                        currency: order.multicurrency_code
                    }).format(parseFloat(order.total_ht)),
                    class: 'text-right'
                };
                tableItems.push(item);
            });

            dolLib.jsonToTable(
                {
                    'ref': chrome.i18n.getMessage('Ref'),
                    'refClient': chrome.i18n.getMessage('RefClient'),
                    'date': chrome.i18n.getMessage('Date'),
                    'total_ht': chrome.i18n.getMessage('Total')
                },
                tableItems,
                document.getElementById("data-from-dolibarr")
            );


        },(errorMsg)=>{
            console.error("setQuotationsInfos" + errorMsg);
        });

    }


/**
 * display propal history
 * @param object confData
 */
function setInvoicesInfos(confData){
    let conf = Object.assign({
        socId: 0
    }, confData);

    // Get contact infos
    return dolLib.callDolibarrApi('invoices', {
        sortfield: 't.rowid',
        sortorder: 'DESC',
        limit:5,
        thirdparty_ids: conf.socId
    }, 'GET', {}, (dataLastInvoices)=>{

        if(!Array.isArray(dataLastInvoices) || dataLastInvoices.length == 0){
            // No contact found in database
            return;
        }

        let tableItems = [];
        dataLastInvoices.forEach((invoice) => {

            let item = {
                'ref': '',
                'refClient': '',
                'date': '',
                'total_ht': ''
            }

            item.ref = {
                html: '<a href="'+ confDolibarUrl + 'compta/facture/card.php?id=' + invoice.id+'" >' + invoice.ref + '</a>'
            };

            if(invoice.ref_client.length > 0){
                item.refClient = {
                    html: invoice.ref_client
                };
            }

            let dateP = new Date(parseInt(invoice.date) * 1000);
            item.date = {
                html: dateP.toLocaleDateString()
            };

            item.total_ht = {
                html: new Intl.NumberFormat([], {
                    style: 'currency',
                    currency: invoice.multicurrency_code
                }).format(parseFloat(invoice.total_ht)),
                class: 'text-right'
            };
            tableItems.push(item);
        });

        dolLib.jsonToTable(
            {
                'ref': chrome.i18n.getMessage('Ref'),
                'refClient': chrome.i18n.getMessage('RefClient'),
                'date': chrome.i18n.getMessage('Date'),
                'total_ht': chrome.i18n.getMessage('Total')
            },
            tableItems,
            document.getElementById("data-from-dolibarr")
        );


    },(errorMsg)=>{
        console.error("setQuotationsInfos" + errorMsg);
    });

}


function displayTpl(id){
    let tpl = document.getElementById(id);
    if(!tpl){
        return;
    }
    tpl.classList.remove('hidden-field');
}


function loadDocumentsInfos(data){
    setQuotationsInfos(data);
    setOrdersInfos(data);
    setInvoicesInfos(data);
}
