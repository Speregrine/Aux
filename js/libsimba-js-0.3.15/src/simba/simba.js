import SimbaBase from './simbabase';
import {
    WalletNotFoundException,
    MissingMetadataException,
    GenerateTransactionException,
    SubmitTransactionException,
    TransactionStatusCheckException,
    NotImplementedException,
    GetTransactionsException,
    GetRequestException
} from '../exceptions';
import PagedResponse from "./pagedresponse";

/**
 * libsimba API Interaction for Simbachain.com
 */
export default class Simbachain extends SimbaBase {
    /**
     * libsimba API Interaction for Simbachain.com
     * @param {string} endpoint - The endpoint of the API
     * @param {Wallet} [wallet] - an optional {@link Wallet} instance
     */
    constructor(endpoint, wallet) {
        super(endpoint, wallet);
    }

    /**
     * @private
     * Perform asynchronous actions needed to initialise this class
     */
    async initialize() {
        let result = await fetch(`${this.endpoint}?format=openapi`);
        let swagger = await result.json();

        if ('info' in swagger && 'x-simba-attrs' in swagger.info) {
            this.metadata = swagger.info['x-simba-attrs'];
        }
    }

    /**
     * @override
     * Call a method on the API
     * @param {string} method - the method to call
     * @param {Object} parameters - the parameters for the method
     * @return {Promise} - a promise resolving with the transaction details
     */
    async callMethod(method, parameters) {
        if (!this.wallet) {
            throw new WalletNotFoundException("No Wallet found");
        }

        this.validateCall(method, parameters);

        let formData = new FormData();
        let address = await this.wallet.getAddress();
        formData.append('from', address);
        for (let [key, value] of Object.entries(parameters)) {
            formData.append(key, value);
        }

        return this.sendMethodRequest(method, formData);
    }

    /**
     * @override
     * Get the status of a transaction by ID
     * @param {string} txnId - the transaction ID
     * @return {Promise<Object>} - a promise resolving with the transaction details
     */
    getTransactionStatus(txnId) {
        return fetch(`${this.endpoint}transaction/${txnId}/`, {
            method: 'GET',
            cache: 'no-cache',
            headers: this.apiAuthHeaders(),
        })
            .then(async (response) => {
                let data = await response.json();

                if (!response.ok) {
                    throw new TransactionStatusCheckException(JSON.stringify(data));
                }

                return data;
            });
    }

    /**
     * @override
     * @private
     * Gets the status of a transaction
     * @param {Object} txn - a transaction object
     * @return {Object} - an object with status details
     */
    checkTransactionStatusFromObject(txn) {
        let ret = {
            status: '',
            transaction_hash: ''
        };

        if (txn.transaction_hash) {
            ret.transaction_hash = txn.transaction_hash;
        }

        if (txn.error) {
            ret.status = 'error';
            ret.error = txn.error;
            ret.error_details = txn.error_details;
        } else if (!txn.receipt) {
            ret.status = 'pending';
        } else {
            ret.status = 'success';
        }

        return ret;
    }

    /**
     * @override
     * @private
     * Check if the transaction is complete
     * @param {Object} txn - the transaction object
     * @return {boolean} - is the transaction complete
     */
    checkTransactionDone(txn) {
        return txn.status !== 'pending';
    }

    /**
     * @override
     * @private
     * Gets the status of a transaction by ID
     * @param {string} txnId - a transaction ID
     * @return {Object} - an object with status details
     */
    checkTransactionStatus(txnId) {
        return this.getTransactionStatus(txnId)
            .then(this.checkTransactionStatusFromObject);
    }

    /**
     * @override
     * Get the balance for the attached Wallet
     * @return {Promise<Object>} - the balance
     */
    async getBalance() {
        if (!this.metadata) {
            throw new MissingMetadataException("App Metadata not yet retrieved");
        }

        if (!this.wallet) {
            throw new WalletNotFoundException("No Wallet found");
        }

        if (this.metadata.poa) {
            return Promise.resolve({
                amount: -1,
                currency: "",
                poa: true
            });
        }

        let address = await this.wallet.getAddress();
        let response = await fetch(
            `${this.endpoint}balance/${address}/`,
            {
                method: 'GET',
                cache: 'no-cache',
                headers: Object.assign({'Content-Type':'application/json'},this.apiAuthHeaders())
            }
        );
        let data = await response.json();

        return Promise.resolve({
            ...data,
            poa: false
        });
    }

    /**
     * @override
     * Add funds to the attached Wallet.
     * Please check the output of this method. It is of the form
     * ```
     * {
     *     txnId: null,
     *     faucet_url: null,
     *     poa: true
     * }
     * ```
     *
     * If successful, txnId will be populated.
     * If the network is PoA, then poa will be true, and txnId will be null
     * If the faucet for the network is external (e.g. Rinkeby, Ropsten, etc), then txnId will be null,
     * and faucet_url will be populated with a URL. You should present this URL to your users to direct them
     * to request funds there.
     * @return {Promise<Object>} - details of the txn
     */
    async addFunds() {
        if (!this.metadata) {
            throw new MissingMetadataException("App Metadata not yet retrieved");
        }

        if (!this.wallet) {
            throw new WalletNotFoundException("No Wallet found");
        }

        let address = await this.wallet.getAddress();

        if (this.metadata.poa) {
            return Promise.resolve({
                txnId: null,
                poa: true,
                faucet_url: null
            });
        }

        if (!this.metadata.simba_faucet) {
            return Promise.resolve({
                txnId: null,
                poa: false,
                faucet_url: this.metadata.faucet
            });
        }

        let requestData = {
            account: address,
            value: "1",
            currency: "ether"
        };

        let response = await fetch(
            `${this.endpoint}balance/${address}/`,
            {
                method: 'POST',
                cache: 'no-cache',
                headers: Object.assign({'Content-Type':'application/json'}, this.apiAuthHeaders()),
                body: JSON.stringify(requestData)
            }
        );

        let data = await response.json();

        return Promise.resolve({
            ...data,
            poa: false,
            faucet_url: null
        });
    }

    /**
     * @override
     * Call a method on the API with files
     * @param {string} method - the method to call
     * @param {Object} parameters- the parameters for the method
     * @param {Array<Blob|File>} files - the files
     * @return {Promise<Object>} - a promise resolving with the transaction details
     */
    async callMethodWithFile(method, parameters, files) {
        if (!this.wallet) {
            throw new WalletNotFoundException("No Wallet found");
        }

        this.validateCall(method, parameters, files);

        let formData = new FormData();
        let address = await this.wallet.getAddress();
        formData.append('from', address);
        for (let [key, value] of Object.entries(parameters)) {
            formData.append(key, value);
        }

        for(let i = 0; i < files.length; i++){
            formData.append(`file[${i}]`, files[i]);
        }

        return this.sendMethodRequest(method, formData);
    }

    /**
     * @private
     * Internal method for sending method calls
     * @param {string} url - the url
     * @param {FormData} formdata - Formdata for the POST
     * @returns {Promise<Response>} - The response with transaction data
     */
    async sendMethodRequest(method, formdata){
        let txnId = null;

        return fetch(`${this.endpoint}${method}/`, {
            method: 'POST',
            cache: 'no-cache',
            headers: this.apiAuthHeaders(),
            body: formdata,
        })
            .then(async (response) => {
                let data = await response.json();

                if (!response.ok) {
                    throw new GenerateTransactionException(JSON.stringify(data));
                }
                // tslint:disable-next-line: no-unsafe-any
                txnId = data.id;
                // tslint:disable-next-line: no-unsafe-any
                const payload = data.payload.raw;
                // tslint:disable-next-line: no-unsafe-any
                const signed = await this.wallet.sign(payload);

                return fetch(`${this.endpoint}transaction/${txnId}/`, {
                    method: 'POST',
                    cache: 'no-cache',
                    headers: Object.assign({'Content-Type':'application/json'},this.apiAuthHeaders()),
                    body: JSON.stringify({payload: signed}),
                })
            })
            .then(async (response) => {
                let data = await response.json();

                if (!response.ok) {
                    throw new SubmitTransactionException(JSON.stringify(data));
                }
                // tslint:disable-next-line: no-console
                console.log('Success!', data);

                return txnId;
            })
    }

    /**
     * @override
     * Gets a specific transaction
     * @param {string} transactionIdOrHash - Either a transaction ID or a transaction hash
     * @returns {Promise<Object>} - The transaction
     */
    async getTransaction(transactionIdOrHash) {
        this.validateAnyGetCall();

        let url = new URL(`${this.endpoint}transaction/${transactionIdOrHash}/`);

        let response = await fetch(url, {
            method: 'GET',
            headers: this.apiAuthHeaders()
        });

        if (!response.ok) {
            throw new GetTransactionsException(await response.text());
        }

        return await response.json();
    }

    /**
     * @override
     * Gets a paged list of transactions
     * @param {Object} parameters - The query parameters
     * @returns {Promise<PagedResponse>} - A response wrapped in a {@link PagedResponse} helper
     */
    async getTransactions(parameters) {
        this.validateAnyGetCall();

        let url = new URL(`${this.endpoint}transaction/`);

        for (let [key, value] of Object.entries(parameters)) {
            url.searchParams.set(key, value);
        }

        return this.sendTransactionRequest(url);
    }

    /**
     * @override
     * Gets a paged list of transactions for the method
     * @param {string} method - The method
     * @param {Object} parameters - The query parameters
     * @returns {Promise<PagedResponse>} - A response wrapped in a {@link PagedResponse} helper
     */
    async getMethodTransactions(method, parameters) {
        this.validateGetCall(method, parameters);

        let url = new URL(`${this.endpoint}${method}/`);

        for (let [key, value] of Object.entries(parameters)) {
            url.searchParams.set(key, value);
        }

        return this.sendTransactionRequest(url);
    }

    /**
     * @protected
     * @override
     * Internal function for sending transaction GET requests
     * @param {URL} url - The URL
     * @returns {Promise<PagedResponse>} - A response wrapped in a {@link PagedResponse} helper
     */
    async sendTransactionRequest(url){
        let response = await fetch(url, {
            method: 'GET',
            headers: this.apiAuthHeaders()
        });

        if (!response.ok) {
            throw new GetTransactionsException(await response.text());
        }

        let json = await response.json();

        return new PagedResponse(json, url, this);
    }


    /**
     * @override
     * Gets a the bundle metadata for a transaction
     * @param {string} transactionIdOrHash - Either a transaction ID or a transaction hash
     * @returns {Promise<Object>} - The bundle metadata
     */
    async getBundleMetadataForTransaction(transactionIdOrHash) {
        let url = new URL(`${this.endpoint}transaction/${transactionIdOrHash}/bundle/`);

        url.searchParams.append('no_files', true);

        let response = await fetch(url, {
            method: 'GET',
            headers: this.apiAuthHeaders()
        });

        if (!response.ok) {
            throw new GetRequestException(await response.text());
        }

        return response.json();
    }

    /**
     * @override
     * Gets the bundle for a transaction
     * @param {string} transactionIdOrHash - Either a transaction ID or a transaction hash
     * @param {boolean} stream - If true, returns a {@link ReadableStream}, otherwise returns a {@link Blob}
     * @returns {Promise<ReadableStream|Blob>} - The bundle
     */
    async getBundleForTransaction(transactionIdOrHash, stream) {
        let url = new URL(`${this.endpoint}transaction/${transactionIdOrHash}/bundle_raw/`);

        let response = await fetch(url, {
            method: 'GET',
            headers: this.apiAuthHeaders()
        });

        if (!response.ok) {
            throw new GetRequestException(await response.text());
        }


        if(!stream){
            return response.blob();
        }

        return response.body;
    }

    /**
     * @override
     * Gets a file from the bundle for a transaction
     * @param {string} transactionIdOrHash - Either a transaction ID or a transaction hash
     * @param {number} fileIdx - The index of the file in the bundle metadata
     * @param {boolean} stream - If true, returns a {@link ReadableStream}, otherwise returns a {@link Blob}
     * @returns {Promise<ReadableStream|Blob>} - The file
     */
    async getFileFromBundleForTransaction(transactionIdOrHash, fileIdx, stream) {
        let url = new URL(`${this.endpoint}transaction/${transactionIdOrHash}/file/${fileIdx}/`);

        let response = await fetch(url, {
            method: 'GET',
            headers: this.apiAuthHeaders()
        });

        if (!response.ok) {
            throw new GetRequestException(await response.text());
        }


        if (!stream) {
            return response.blob();
        }

        return response.body;
    }

    /**
     * @override
     * Gets a file from the bundle for a transaction
     * @param {string} transactionIdOrHash - Either a transaction ID or a transaction hash
     * @param {string} fileName - The name of the file in the bundle metadata
     * @param {boolean} stream - If true, returns a {@link ReadableStream}, otherwise returns a {@link Blob}
     * @returns {Promise<ReadableStream|Blob>} - The file
     */
    async getFileFromBundleByNameForTransaction(transactionIdOrHash, fileName, stream) {
        let url = new URL(`${this.endpoint}transaction/${transactionIdOrHash}/fileByName/${fileName}/`);

        let response = await fetch(url, {
            method: 'GET',
            headers: this.apiAuthHeaders()
        });

        if (!response.ok) {
            throw new GetRequestException(await response.text());
        }


        if (!stream) {
            return response.blob();
        }

        return response.body;
    }
}
