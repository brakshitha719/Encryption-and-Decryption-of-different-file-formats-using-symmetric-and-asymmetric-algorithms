// Switch UI
function switchAlgo() {
    ["aesBox", "rsaBox", "desBox", "caesarBox"].forEach(id =>
        document.getElementById(id).classList.add("hidden")
    );
    let sel = algoSelect.value;
    if (sel !== "none") document.getElementById(sel + "Box").classList.remove("hidden");
}

/* -------------------- AES FILE -------------------- */
const arrBufToWordArray = buf => {
    let u8 = new Uint8Array(buf), wa = [];
    for (let i = 0; i < u8.length; i += 4)
        wa.push((u8[i]<<24)|(u8[i+1]<<16)|(u8[i+2]<<8)|u8[i+3]);
    return CryptoJS.lib.WordArray.create(wa, u8.length);
};

const wordArrayToUint8 = wa => {
    let out = new Uint8Array(wa.sigBytes), words = wa.words;
    for (let i = 0; i < out.length; i++)
        out[i] = (words[i>>>2] >>> (24-(i%4)*8)) & 255;
    return out;
};

async function aEnc() {
    let f = afile.files[0]; if (!f) return;
    aout.textContent = "Encrypting…";
    let data = arrBufToWordArray(await f.arrayBuffer());
    let key = CryptoJS.SHA256(akey.value), iv = CryptoJS.lib.WordArray.random(16);
    let enc = CryptoJS.AES.encrypt(data, key, { iv }).ciphertext;
    let result = iv.concat(enc).toString(CryptoJS.enc.Base64);
    let a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([result], { type:"text/plain" }));
    a.download = f.name + ".enc"; a.click();
    aout.textContent = "✅ Encrypted (file downloaded)";
}

async function aDec() {
    let f = afile.files[0]; if (!f) return;
    aout.textContent = "Decrypting…";
    let raw = CryptoJS.enc.Base64.parse(await f.text());
    let iv = CryptoJS.lib.WordArray.create(raw.words.slice(0,4),16);
    let ct = CryptoJS.lib.WordArray.create(raw.words.slice(4), raw.sigBytes-16);
    let dec = CryptoJS.AES.decrypt({ ciphertext: ct }, CryptoJS.SHA256(akey.value), { iv });
    let bytes = wordArrayToUint8(dec), originalName = f.name.replace(/\.enc$/,"");
    let ext = originalName.split(".").pop().toLowerCase();
    let mime = {txt:"text/plain",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",pdf:"application/pdf"}[ext] || "application/octet-stream";
    let url = URL.createObjectURL(new Blob([bytes], { type:mime }));
    if (["jpg","jpeg","png","pdf","txt"].includes(ext)) window.open(url,"_blank");
    else { let a=document.createElement("a"); a.href=url; a.download=originalName; a.click(); }
    aout.textContent = "✅ Decrypted (file ready)";
}

/* -------------------- RSA -------------------- */
function genRSA() {
    let rsa = new JSEncrypt({ default_key_size:1024 });
    pub.value = rsa.getPublicKey(); priv.value = rsa.getPrivateKey();
    rout.textContent = "🔑 RSA Keys Generated";
}
function rEnc() {
    let rsa = new JSEncrypt(); rsa.setPublicKey(pub.value.trim());
    let enc = rsa.encrypt(rmsg.value);
    rout.textContent = enc ? "🔐 " + enc : "❌ Encryption Failed";
}
function rDec() {
    let rsa = new JSEncrypt(); rsa.setPrivateKey(priv.value.trim());
    let dec = rsa.decrypt(rmsg.value);
    rout.textContent = dec ? "🔓 " + dec : "❌ Wrong Key or Invalid Cipher";
}

/* -------------------- DES -------------------- */
function dEnc() {
    try { dout.textContent = "🔐 " + CryptoJS.DES.encrypt(dmsg.value,dkey.value).toString(); }
    catch { dout.textContent = "❌ Error"; }
}
function dDec() {
    try {
        let dec = CryptoJS.DES.decrypt(dmsg.value,dkey.value).toString(CryptoJS.enc.Utf8);
        dout.textContent = dec ? "🔓 " + dec : "❌ Wrong Key";
    } catch { dout.textContent = "❌ Invalid Cipher"; }
}

/* -------------------- Caesar Cipher -------------------- */
const caesar = (t,s) => [...t].map(c=>{
    let x=c.charCodeAt(0);
    if (x>=65&&x<=90) return String.fromCharCode((x-65+s)%26+65);
    if (x>=97&&x<=122) return String.fromCharCode((x-97+s)%26+97);
    return c;
}).join("");

function cEnc(){ cout.textContent="🔐 "+caesar(cmsg.value,+cshift.value||0); }
function cDec(){ cout.textContent="🔓 "+caesar(cmsg.value,(26-(+cshift.value||0))%26); }
