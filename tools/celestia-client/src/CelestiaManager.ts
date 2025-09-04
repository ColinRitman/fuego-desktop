// Note: @celestiaorg/celestia-js types will be available after npm install
// Replaced SDK with simple REST client using axios
import axios, { AxiosInstance } from 'axios';

// Minimal REST API wrapper (only the endpoints we use)
interface CelestiaRestResponse<T> {
    height: number;
    result: T;
}

export interface SubmitBlobResponse {
    height: number;
    commitment: string;
}

export interface BlobSubmissionResult {
    height: number;
    commitment: string;
    namespace: string;
    dataHash: string;
}

export interface BlobData {
    namespace: string;
    data: Uint8Array;
    shareVersion: number;
}

export class CelestiaManager {
    private client: AxiosInstance;
    private namespace: string;
    
    constructor(
        private rpcUrl: string,
        namespace: string = "000000000000000000000000000000000000000000000000434f4c44" // "COLD"
    ) {
        this.namespace = namespace;
        this.client = axios.create({ baseURL: rpcUrl, timeout: 10000 });
    }
    
    /**
     * Submit blob data to Celestia
     */
    async submitBlob(txData: Uint8Array): Promise<BlobSubmissionResult> {
        try {
            console.log(`Submitting blob to namespace: ${this.namespace}`);
            console.log(`Data size: ${txData.length} bytes`);

            // Celestia-node REST expects base64 string payload in /submit_pfb
            const payload = {
                namespace_id: this.namespace,
                data: Buffer.from(txData).toString('base64'),
                share_version: 0
            };

            const { data } = await this.client.post<SubmitBlobResponse>('/submit_pfb', payload);

            const dataHash = this.computeDataHash(txData);

            return {
                height: data.height,
                commitment: data.commitment,
                namespace: this.namespace,
                dataHash
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error submitting blob:', error);
            throw new Error(`Failed to submit blob: ${errorMessage}`);
        }
    }
    
    /**
     * Retrieve blob data from Celestia
     */
    async getBlob(height: number, namespace?: string): Promise<Uint8Array> {
        try {
            const targetNamespace = namespace || this.namespace;
            
            console.log(`Retrieving blob from height: ${height}, namespace: ${targetNamespace}`);
            
            const { data } = await this.client.get<CelestiaRestResponse<string[]>>(`/blob/namespaces/${targetNamespace}/heights/${height}`);

            if (!data.result || data.result.length === 0) {
                throw new Error(`No blobs found at height ${height} for namespace ${targetNamespace}`);
            }

            // Celestia node returns base64 strings
            return Buffer.from(data.result[0], 'base64');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error retrieving blob:', error);
            throw new Error(`Failed to retrieve blob: ${errorMessage}`);
        }
    }
    
    /**
     * Verify blob inclusion at specific height
     */
    async verifyBlobInclusion(
        height: number, 
        expectedDataHash: string,
        namespace?: string
    ): Promise<boolean> {
        try {
            const blobData = await this.getBlob(height, namespace);
            const actualDataHash = this.computeDataHash(blobData);
            
            return actualDataHash === expectedDataHash;
        } catch (error: unknown) {
            console.error('Error verifying blob inclusion:', error);
            return false;
        }
    }
    
    /**
     * Get the current head height of Celestia
     */
    async getLatestHeight(): Promise<number> {
        try {
            const { data } = await this.client.get<CelestiaRestResponse<{ header: { height: number } }>>('/header');
            return data.result.header.height;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Error getting latest height:', error);
            throw new Error(`Failed to get latest height: ${errorMessage}`);
        }
    }
    
    /**
     * Wait for blob to be included (polling)
     */
    async waitForInclusion(
        targetHeight: number, 
        timeoutMs: number = 60000
    ): Promise<boolean> {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeoutMs) {
            try {
                const currentHeight = await this.getLatestHeight();
                
                if (currentHeight >= targetHeight) {
                    return true;
                }
                
                // Wait 2 seconds before checking again
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: unknown) {
                console.warn('Error while waiting for inclusion:', error);
            }
        }
        
        return false;
    }
    
    /**
     * Compute keccak256 hash of data
     */
    private computeDataHash(data: Uint8Array): string {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    /**
     * Get namespace info
     */
    getNamespace(): string {
        return this.namespace;
    }
    
    /**
     * Set new namespace
     */
    setNamespace(namespace: string): void {
        this.namespace = namespace;
    }
}

export default CelestiaManager; 