import { PostHog } from 'posthog-node'
import Plans from '../security/plans'
import { FeatureFlag } from '../types/common'
import { timeout } from '../utils/timing'

export default async (
    featureFlag: FeatureFlag,
    tenantId: string,
    posthog: PostHog,
    payload: any
): Promise<void> => {
    if (featureFlag === FeatureFlag.AUTOMATIONS) {
        const expectedFlag = (payload.plan === Plans.values.growth) || (payload.plan === Plans.values.essential && payload.automationCount < 2)

        let featureFlagEnabled = await posthog.isFeatureEnabled(featureFlag, '', {
            groups: { tenant: tenantId },
        })

        let tries = 0
        const MAX_TRY_COUNT = 10

        while (expectedFlag !== featureFlagEnabled && tries < MAX_TRY_COUNT) {
            await timeout(500)
            featureFlagEnabled = await posthog.isFeatureEnabled(featureFlag, '', {
                groups: { tenant: tenantId },
            })

            tries += 1
            if (tries === 5) {
                console.log(`Tried ${MAX_TRY_COUNT} times to sync the flags without luck... Breaking`)
            }

        }

    }

    console.log(`Feature flag ${featureFlag} is ensured!`)

}
