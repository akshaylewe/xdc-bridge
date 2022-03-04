// @ts-nocheck TODO remove and fix
import Web3 from "web3";
import DeBridgeGateJson from "../../../Gate.json";
import DeployerJson from "../../../Deployer.json";
import log4js from "log4js";
import {log4jsConfig, Web3RpcUrl} from "./constants";
import "./parseDotEnvs";

log4js.configure(log4jsConfig);

const logger = log4js.getLogger('claim');

const privKey = process.env.PRIVATE_KEY;
const account = new Web3().eth.accounts.privateKeyToAccount(privKey);
const senderAddress =  account.address;
logger.info(`senderAddress : ${senderAddress}`);

const {API_ENDPOINT} = process.env;
const DEBRIDGEGATE_ADDRESS = '0x196817647f6d3AcC2b9b61cbd413a5f1Fc7f4AAB'
const SUBMISSION_ID = process.env.SUBMISSION_ID;
logger.info(`SUBMISSION_ID : ${SUBMISSION_ID}`);

(async () => {
    try {
        const chainIdTo = 5777;
        const rpc = Web3RpcUrl[chainIdTo];
        const web3 = new Web3(rpc);

        const debridgeGateInstance = new web3.eth.Contract(DeBridgeGateJson.abi, DEBRIDGEGATE_ADDRESS);
        const deployerInstance = new web3.eth.Contract(DeployerJson.abi, '0x9d3aa77303f6175CEDc2Ea55823A55F434793AF0');
        const isSubmissionUsed = await debridgeGateInstance.methods.isSubmissionUsed(SUBMISSION_ID).call();
        const debridge_id = await debridgeGateInstance.methods.getDebridgeId(51, '0xeAe46f035CfAA057D31F9a3777285beC69d9679C').call();
        const debridge_ids = await debridgeGateInstance.methods.deployNewAsset('0xeAe46f035CfAA057D31F9a3777285beC69d9679C', 51, 'MappedXDC', 'MXDC', 18, '0x').call();
        logger.info(`DEBRIDGE_IDs : ${debridge_id}`);
        // const _token = await deployerInstance.methods.deployAsset(debridge_id, 'Token Mapped with XDC Chain', 'WXDC1', 18).call();
        // logger.info(`Token : ${_token}`);
        logger.info(`Token2 : ${debridge_ids[1]}`);


        if (isSubmissionUsed) {
            logger.error(`Submission already used`);
            return;
        }

        let mergedSignatures = '0x';
        // for (const confiramtion of confirmationsResponse.confirmations) {
        //     mergedSignatures += confiramtion.signature.substring(2, confiramtion.signature.length);
        // }

        const autoParamsFrom = await _packSubmissionAutoParamsFrom(web3, '0x');

        await claim(
            web3,
            debridgeGateInstance,
            debridge_id,
            '50000000000000000',
            '51',
            '0x852e7627aEFF3ed6105F600D985cC6f74DBd6640',
            SUBMISSION_ID,
            mergedSignatures,
            autoParamsFrom
        );
    } catch (e) {
        logger.error(e);
    }
})();


async function claim(
    web3,
    debridgeGateInstance,
    debridgeId, //bytes32 _debridgeId,
    amount, // uint256 _amount,
    chainIdFrom, //uint256 _chainIdFrom,
    receiver, // address _receiver,
    subNonce, // uint256 _nonce
    signatures, //bytes calldata _signatures,
    autoParams, //bytes calldata _autoParams
) {
    logger.info("Test claim");
    let nonce = await web3.eth.getTransactionCount(senderAddress);
    logger.info("Nonce current", nonce);
    const gasPrice = await web3.eth.getGasPrice();
    logger.info("gasPrice", gasPrice.toString());
    logger.info({
        debridgeId, //bytes32 _debridgeId,
        amount, // uint256 _amount,
        chainIdFrom, //uint256 _chainIdFrom,
        receiver, // address _receiver,
        nonce, // uint256 _nonce
        signatures, //bytes calldata _signatures,
        autoParams, //bytes calldata _autoParams
    });


    // const estimateGas = await debridgeGateInstance.methods
    // .claim(
    //     debridgeId, //bytes32 _debridgeId,
    //     amount, // uint256 _amount,
    //     chainIdFrom, //uint256 _chainIdFrom,
    //     receiver, // address _receiver,
    //     subNonce, // uint256 _nonce
    //     signatures, //bytes calldata _signatures,
    //     autoParams, //bytes calldata _autoParams
    // )
    // .estimateGas({
    //     from: senderAddress
    // });

    // logger.info("estimateGas", estimateGas.toString());

    const tx =
    {
        from: senderAddress,
        to: DEBRIDGEGATE_ADDRESS,
        gas: 300000,
        value: 0,
        gasPrice: gasPrice,
        nonce,
        data: debridgeGateInstance.methods
            // function claim(
            //     bytes32 _debridgeId,
            //     uint256 _amount,
            //     uint256 _chainIdFrom,
            //     address _receiver,
            //     uint256 _nonce,
            //     bytes calldata _signatures,
            //     bytes calldata _autoParams
            // )
            .claim(
                debridgeId, //bytes32 _debridgeId,
                amount, // uint256 _amount,
                chainIdFrom, //uint256 _chainIdFrom,
                receiver, // address _receiver,
                subNonce, // uint256 _nonce
                signatures, //bytes calldata _signatures,
                autoParams, //bytes calldata _autoParams
            )
            .encodeABI(),
    };

    logger.info("Tx", tx);
    const signedTx = await web3.eth.accounts.signTransaction(tx, privKey);
    logger.info("Signed tx", signedTx);

    const result = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    logger.info("Result", result);
    logger.info("Success");
}


async function _checkConfirmation(submissionId, minConfirmations) {
    const confirmations = await getSubmissionConfirmations(submissionId, API_ENDPOINT);
    return {
        isConfirmed: (confirmations.length >= minConfirmations),
        confirmations,
    }
}


async function _packSubmissionAutoParamsFrom(web3, autoParams) {
    if (autoParams !== '0x' && autoParams !== '') {
        const decoded = web3.eth.abi.decodeParameters(
            ['tuple(uint256,uint256, bytes, bytes)'], autoParams
        );
        logger.info(`autoParams: ${autoParams}, decoded: ${decoded}`);
        const encoded = web3.eth.abi.encodeParameter(
            'tuple(uint256,uint256, address, bytes, bytes)',
            [decoded[0][0], decoded[0][1], decoded[0][2], decoded[0][3]]
        );
        logger.info(`encoded: ${encoded}`);
        return encoded;
    }
    return '0x';
}
