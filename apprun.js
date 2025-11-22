import { IExec, utils } from 'iexec';
import 'dotenv/config';

const ARBITRUM_SEPOLIA_RPC = 'https://sepolia-rollup.arbitrum.io/rpc';

/**
 * Équivalent de "iexec app run" en utilisant le SDK JS sur Arbitrum Sepolia.
 */
export async function appRunLikeCli({
  appAddress,
  workerpoolAddress,   // optionnel si tu veux laisser le market choisir
  args,
  category = 0,
  maxPrice,        // en nRLC, 0 = pas de limite / market
}) {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY manquante dans .env');
  }

  // 1. Signer sur Arbitrum Sepolia
  const ethProvider = utils.getSignerFromPrivateKey(
    ARBITRUM_SEPOLIA_RPC,
    privateKey,
  );
  const iexec = new IExec({ ethProvider });

  // 2. Vérifier réseau
  const { chainId } = await iexec.network.getNetwork();
  //if (chainId !== 421614) {
  //  throw new Error(
  //    `Mauvais réseau: attendu Arbitrum Sepolia (421614), obtenu ${chainId}`,
  //  );
 // }

  // 3. Construire le requestorder comme le CLI
  const requestorderToSign = await iexec.order.createRequestorder({
  app: appAddress,
  category,
  appmaxprice: maxPrice,        // prix max pour l'app
  workerpoolmaxprice: maxPrice, // prix max pour le workerpool
  ...(workerpoolAddress && { workerpool: workerpoolAddress }),
  params: {
    iexec_args: args,
  },
});

  const requestorder = await iexec.order.signRequestorder(requestorderToSign);

  // 4. Récupérer un apporder compatible (comme le market du CLI)
  const appOrderbook = await iexec.orderbook.fetchAppOrderbook({app: appAddress,});
  if (!appOrderbook.orders.length) {
    throw new Error('Aucun apporder disponible pour cette app');
  }
  const apporder = appOrderbook.orders[0].order;

  // 5. Récupérer un workerpoolorder compatible
  let workerpoolorder;
  if (workerpoolAddress) {
    const wpOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      workerpool: workerpoolAddress,
      category,
    });
    if (!wpOrderbook.orders.length) {
      throw new Error('Aucun workerpoolorder pour ce workerpool + category');
    }
    workerpoolorder = wpOrderbook.orders[0].order;
  } else {
    // mode "market" : laisser le market choisir un workerpool public
    const wpOrderbook = await iexec.orderbook.fetchWorkerpoolOrderbook({
      category,
    });
    if (!wpOrderbook.orders.length) {
      throw new Error('Aucun workerpoolorder public disponible pour cette category');
    }
    workerpoolorder = wpOrderbook.orders[0].order;
  }

  // 6. matchOrders = création de la task (équivalent de `iexec app run`)
  const { taskId } = await iexec.order.matchOrders({
    apporder,
    workerpoolorder,
    requestorder,
  });

  console.log('Task submitted, taskId =', taskId);
  return taskId;
}

// test
(async () => {
  try {
    const taskId = await appRunLikeCli({
      appAddress: '0xbb21e58a72327a5fdA6f5d3673f1fab6607aeab1',
      workerpoolAddress: "0xb967057a21dc6a66a29721d96b8aa7454b7c383f",
      args:'"0x04689fa0892c1c5530b9ce160800ea03cab1e93c501b248f72366ee1060ad29d503fc3754c8449e48a2dfdeeef56a9c24dc76830f4084db5d3209f304f1e532f89174b572515dadc29101719b73e2b93d9a6657e5690fa97f312cf73f20af152ac60e99e" "0x1234567890abcdef1234567890abcdef12345678" "0xfedcba0987654321fedcba0987654321fedcba09"',
      category: 0,
      maxPrice: 100000000,
    });
    console.log('Task :', taskId);
  } catch (e) {
    console.error(e);
  }
})();
