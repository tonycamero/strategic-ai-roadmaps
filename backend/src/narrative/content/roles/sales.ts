import { NarrativeBlock } from '../../types';

export const S1_MemoryFollowUp: NarrativeBlock = {
    id: 'S1_MemoryFollowUp',
    category: 'Role',
    appliesWhen: { role: ['sales'] },
    priority: 50,
    content: {
        headline: 'Sales Pattern: Memory-Based Follow-up',
        body: 'Revenue relies on who you remember to email, not who needs emailing. You are running a mental CRM that drops leads the moment volume increases or you take a day off.',
        implications: [
            'Tell: "I have it all in my head / strictly organized in my inbox."',
            'Conversion integrity collapses as lead volume scales.'
        ]
    }
};

export const S2_AuthorityBypass: NarrativeBlock = {
    id: 'S2_AuthorityBypass',
    category: 'Role',
    appliesWhen: { role: ['sales'] },
    priority: 50,
    content: {
        headline: 'Sales Pattern: Authority Bypass',
        body: 'You sell past the process to get the deal done. By making promises that operations cannot fulfill without heroics, you close revenue today at the expense of profit margin tomorrow.',
        implications: [
            'Tell: "We\'ll figure out how to deliver it later, just get the sign." ',
            'Every deal requires a custom delivery plan.'
        ]
    }
};

export const S3_PipelineGuessing: NarrativeBlock = {
    id: 'S3_PipelineGuessing',
    category: 'Role',
    appliesWhen: { role: ['sales'] },
    priority: 50,
    content: {
        headline: 'Sales Pattern: Pipeline Guessing',
        body: 'Your forecast is a feeling, not a calculation. Without objective exit criteria for deal stages, your pipeline value is an optimized hallucination rather than a bankable asset.',
        implications: [
            'Tell: "I feel good about these three deals closing this month."',
            'Revenue surprises (misses) happen late in the quarter.'
        ]
    }
};

export const S4_DiscountSubstitute: NarrativeBlock = {
    id: 'S4_DiscountSubstitute',
    category: 'Role',
    appliesWhen: { role: ['sales'] },
    priority: 50,
    content: {
        headline: 'Sales Pattern: Discount as Substitute',
        body: 'You use pricing leverage to mask value gaps. Instead of enforcing a sales process that builds value, you drop the price to remove friction, training customers to devalue the product.',
        implications: [
            'Tell: "I can knock 20% off if you sign by Friday."',
            'Margins erode while volume activity remains high.'
        ]
    }
};
