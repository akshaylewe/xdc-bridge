// @ts-nocheck 
//importing Axios 
import axios from 'axios';

    /**
     * @dev Gets the submission hash value.
     * @para Api end point.
     * @return an String representing the submission id of the address.
     */
async function getSubmissions(_params, API_ENDPOINT) {
    const params = _params || {};
    const url = `${API_ENDPOINT}/api/Transactions/getUnclaimedTransactions`;
    const response = await axios.get(url, {params});
    return response.data;
}

    /**
     * @dev Gets the submission hash value.
     * @para Submission id and Api end point.
     * @return Verifying the submission id (hash value).
     */
async function getSubmission(submissionId, API_ENDPOINT) {
    const url = `${API_ENDPOINT}/api/Transactions/GetFullSubmissionInfo?filter=${submissionId}&filterType=2`;
    const response = await axios.get(url);
    return response.data.send;
}

    /**
     * @dev Confirming the submission hash value.
     * @para Submission id and Api end point.
     * @return Confirming the submission id (hash value).
     */
async function getSubmissionConfirmations(submissionId, API_ENDPOINT) {
    const url = `${API_ENDPOINT}/api/SubmissionConfirmations/getForSubmission?submissionId=${submissionId}`;
    const response = await axios.get(url);
  return response.data;
}


async function getNewAssetDeployConfirmations(debridgeId, API_ENDPOINT) {
    const url = `${API_ENDPOINT}/api/ConfirmNewAssets/GetForDebridgeId?debridgeId=${debridgeId}`;
    const response = await axios.get(url);
    return response.data;
}

export {
    getSubmissions, getSubmission, getSubmissionConfirmations, getNewAssetDeployConfirmations,
};