import { readFileSync } from "fs";
import { IExecIApp, getWeb3Provider } from "@mage-sombre/iapp";

// Charger la configuration
const config = JSON.parse(readFileSync("./iapp.config.json", "utf8"));
const { walletPrivateKey } = config;

// Créer le web3Provider avec la clé privée
const web3Provider = getWeb3Provider(walletPrivateKey);

// Initialiser iExecIApp avec le provider
const iapp = new IExecIApp(web3Provider);

console.log("✅ iExecIApp initialisé avec succès");

// Vérifier d'abord les iApps que vous possédez
console.log("\n🔍 Recherche de vos iApps...");
try {
    const myApps = await iapp.getIApp({ owner: walletPrivateKey });
    console.log(`📱 Vous possédez ${myApps.length} iApp(s)`);
    if (myApps.length > 0) {
        console.log("Vos iApps:");
        myApps.forEach((app, index) => {
            console.log(`  ${index + 1}. ${app.name} - ${app.address}`);
        });
    }
} catch (error) {
    console.log("ℹ️  Impossible de récupérer vos iApps:", error.message);
}

// Vérifier si l'iApp cible existe
console.log("\n🔍 Vérification de l'iApp cible 0xea5955348c63795726f0acb4abbbfd1c9df75090...");
try {
    const targetApps = await iapp.getIApp({ address: '0xea5955348c63795726f0acb4abbbfd1c9df75090' });
    if (targetApps.length > 0) {
        console.log("✅ iApp trouvée:");
        console.log(`   Nom: ${targetApps[0].name}`);
        console.log(`   Propriétaire: ${targetApps[0].owner}`);
        console.log(`   Adresse: ${targetApps[0].address}`);
    } else {
        console.log("❌ iApp non trouvée à cette adresse");
    }
} catch (error) {
    console.log("ℹ️  Erreur lors de la recherche de l'iApp:", error.message);
}

// Accorder l'accès à l'adresse spécifiée
console.log("\n🔐 Tentative d'accord de l'accès à l'iApp...");
try {
    const grantResult = await iapp.grantAccess({
        iapp: '0xea5955348c63795726f0acb4abbbfd1c9df75090',
        authorizedUser: '0x0000000000000000000000000000000000000000', // Autoriser tout le monde
        pricePerAccess: '0',
        numberOfAccess: '9007199254740991' // Valeur maximale autorisée
    });
    
    console.log("✅ Accès accordé avec succès!");
    console.log("Détails:", JSON.stringify(grantResult, null, 2));
} catch (error) {
    console.log("❌ Erreur lors de l'accord de l'accès:", error.message);
    if (error.cause) {
        console.log("   Cause:", error.cause.message);
    }
    console.log("\n💡 Note: Vous devez être le propriétaire de l'iApp pour accorder l'accès.");
}
