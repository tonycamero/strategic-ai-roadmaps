import { loadInventory } from '../trustagent/services/inventory.service';

export class CapabilityMatcherService {
    /**
     * Validate a capabilityId assigned during Stage-5 against the inventory catalog and Execution Envelope
     */
    static validateCapabilityId(
        capabilityId: string | null | undefined,
        allowedNamespaces: string[],
        maxComplexity: 'T1' | 'T2' | 'T3'
    ): void {
        if (!capabilityId) {
            throw new Error('CAPABILITY_NOT_ALLOWED: Missing capabilityId from Selection Envelope');
        }

        // 1. lookup capabilityId in inventory registry
        const fullInventory = loadInventory();
        const inventoryItem = fullInventory.find(item => item.inventoryId === capabilityId);

        if (!inventoryItem) {
            throw new Error(`CAPABILITY_NOT_ALLOWED: Capability ${capabilityId} not found in inventory registry`);
        }

        // 2. verify namespace allowed by envelope
        // Category is mapped to namespace in S6 context
        if (!allowedNamespaces.includes(inventoryItem.category)) {
            throw new Error(`CAPABILITY_NOT_ALLOWED: Namespace ${inventoryItem.category} not allowed by Execution Envelope`);
        }

        // 3. verify complexityTier allowed
        const complexityMap: Record<string, string> = { 'low': 'T1', 'medium': 'T2', 'high': 'T3' };
        const tierOrder: Record<string, number> = { 'T1': 1, 'T2': 2, 'T3': 3 };

        const itemTier = (complexityMap[inventoryItem.complexity] || 'T1') as keyof typeof tierOrder;

        if (tierOrder[itemTier] > tierOrder[maxComplexity]) {
            throw new Error(`CAPABILITY_NOT_ALLOWED: Complexity ${itemTier} exceeds tenant limit ${maxComplexity}`);
        }

        // 4. verify dependency metadata exists (Part 2 rule 3)
        if (!inventoryItem.dependencies || !Array.isArray(inventoryItem.dependencies)) {
            throw new Error(`CAPABILITY_NOT_ALLOWED: Missing dependency metadata for ${capabilityId}`);
        }
    }
}

