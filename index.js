
let csv = require('csv');
let obj = csv();

const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const PHONE_NUMBER_FORMAT = require('google-libphonenumber').PhoneNumberFormat;
let emailValidator = require("email-validator");

var fs = require('fs');

let titles = [];
let output = [];

obj.from.path('input.csv').to.array(function (data) {

    // Sets up titles
    for (let i = 0; i < data[0].length; i++) {
        titles.push(data[0][i]);
    }

    let newRecord = {};

    for (let i = 1; i < data.length; i++) {

        let invisible = false;
        let seeAll = false;

        for (let j = 0; j < data[i].length; j++) {
            switch (titles[j]) {

                case "class":
                    if (data[i][j] != "") {
                        let classes = Array.from(data[i][j].split(/[\t/,]+/));

                        classes = classes.map(Function.prototype.call, String.prototype.trim);

                        if (newRecord["classes"] == null) {
                            newRecord["classes"] = classes;
                        } else {
                            newRecord["classes"] = newRecord["classes"].concat(classes);
                        }
                    }
                    break;

                case "eid":
                    newRecord["eid"] = data[i][j];
                    break;

                case "fullname":
                    if (newRecord["fullname"] == null) {
                        newRecord["fullname"] = data[i][j];
                    } else if (newRecord["fullname"] != data[i][j]) {
                        output.push(newRecord);
                        newRecord = {};
                        newRecord["fullname"] = data[i][j];
                    }
                    break;

                case "invisible":
                    if (data[i][j] === "1") {
                        invisible = true;
                    }
                    if (newRecord["invisible"] == null || invisible == true) {
                        newRecord["invisible"] = invisible;
                    }
                    break;

                case "see_all":
                    if (data[i][j] === "yes") {
                        seeAll = true;
                    }

                    if (newRecord["see_all"] == null || seeAll == true) {
                        newRecord["see_all"] = seeAll;
                    }
                    break;

                default:
                    if (data[i][j] != "") {
                        let titleParsed = titles[j].split(/[\s/,]+/);

                        let tags = [];
                        for (let k = 1; k < titleParsed.length; k++) {
                            tags.push(titleParsed[k]);
                        }

                        if (titleParsed[0] == "email") {
                            let emailParsed = data[i][j].split('/');
                            for (let k = 0; k < emailParsed.length; k++) {
                                if (emailValidator.validate(emailParsed[k])) {

                                    let addedTag = verifyAddress("addresses", emailParsed[k], tags);

                                    let address = { "type": titleParsed[0], "tags": tags, "address": emailParsed[k] };

                                    if (!addedTag) {
                                        record("addresses", address);
                                    }
                                }
                            }
                        } else if (titleParsed[0] == "phone") {
                            try {
                                const number = phoneUtil.parseAndKeepRawInput(data[i][j], 'BR');
                                if (phoneUtil.isValidNumber(number)) {

                                    let phone = phoneUtil.format(number, PHONE_NUMBER_FORMAT.E164);

                                    phone = phone.substring(1, phone.length);

                                    let addedTag = verifyAddress("addresses", phone, tags);

                                    let address = { "type": titleParsed[0], "tags": tags, "address": phone };

                                    if (!addedTag) {
                                        record("addresses", address);
                                    }
                                }
                            } catch (e) {
                            }
                        }
                    }
                    break;
            }
        }

        if (i == data.length - 1) {
            output.push(newRecord);
        }
    }

    fs.writeFile("output.json", JSON.stringify(output), (err) => {
        if (err) {
            console.log(err);
        }
    });

    function record(key, address) {
        if (newRecord[key] == null) {
            newRecord[key] = [address];
        } else {
            newRecord[key].push(address);
        }
    }

    function verifyAddress(key, newAddress, tags) {
        if (newRecord[key] != null) {
            for (let l = 0; l < newRecord[key].length; l++) {
                if (newRecord[key][l].address === newAddress) {
                    newRecord[key][l]["tags"] = newRecord["addresses"][l]["tags"].concat(tags);
                    return true;
                }
            }
        }
        return false;
    }
});