import passport from 'passport'
import { TWITTER_CONFIG, SLACK_CONFIG, DISCORD_CONFIG } from '../../config'
import { authMiddleware } from '../../middlewares/authMiddleware'
import TenantService from '../../services/tenantService'
import { getTwitterStrategy } from '../../services/auth/passportStrategies/superfaceTwitterStrategy'
import { getSlackStrategy } from '../../services/auth/passportStrategies/slackStrategy'
import { safeWrap } from '../../middlewares/errorMiddleware'

export default (app) => {
  app.post(`/tenant/:tenantId/integration/query`, safeWrap(require('./integrationQuery').default))
  app.post(`/tenant/:tenantId/integration`, safeWrap(require('./integrationCreate').default))
  app.put(`/tenant/:tenantId/integration/:id`, safeWrap(require('./integrationUpdate').default))
  app.post(`/tenant/:tenantId/integration/import`, safeWrap(require('./integrationImport').default))
  app.delete(`/tenant/:tenantId/integration`, safeWrap(require('./integrationDestroy').default))
  app.get(
    `/tenant/:tenantId/integration/autocomplete`,
    safeWrap(require('./integrationAutocomplete').default),
  )
  app.get(`/tenant/:tenantId/integration`, safeWrap(require('./integrationList').default))
  app.get(`/tenant/:tenantId/integration/:id`, safeWrap(require('./integrationFind').default))

  app.put(
    `/authenticate/:tenantId/:code`,
    safeWrap(require('./helpers/githubAuthenticate').default),
  )
  app.get(
    '/tenant/:tenantId/devto-validate',
    safeWrap(require('./helpers/devtoValidators').default),
  )
  app.post(
    '/tenant/:tenantId/devto-connect',
    safeWrap(require('./helpers/devtoCreateOrUpdate').default),
  )

  if (TWITTER_CONFIG.clientId) {
    passport.use(getTwitterStrategy())

    /**
     * Using the passport.authenticate this endpoint forces a
     * redirect to happen to the twitter oauth2 page.
     * We keep a state of the important variables such as tenantId, redirectUrl, ..
     * so that after user logs in through the twitter page, these
     * variables are forwarded back to the callback as well
     * This state is sent using the authenticator options and
     * manipulated through twitterStrategy.staticPKCEStore
     */
    app.get(
      '/twitter/:tenantId/connect',
      safeWrap(require('./helpers/twitterAuthenticate').default),
      () => {
        // The request will be redirected for authentication, so this
        // function will not be called.
      },
    )

    /**
     * OAuth2 callback endpoint.  After user successfully
     * logs in through twitter page s/he is redirected to
     * this endpoint. Few middlewares first mimic a proper
     * api request in this order:
     *
     * Set headers-> Auth middleware (currentUser)-> Set currentTenant
     * -> finally we call the project service to update the
     * corresponding project.
     *
     * We have to call these standart middlewares explicitly because
     * the request method is get and tenant id does not exist in the
     * uri as request parameters.
     *
     */
    app.get(
      '/twitter/callback',
      passport.authenticate('twitter', {
        session: false,
        failureRedirect: '/',
      }),
      (req, _res, next) => {
        const { crowdToken } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.headers.authorization = `Bearer ${crowdToken}`
        next()
      },
      authMiddleware,
      async (req, _res, next) => {
        const { tenantId } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.currentTenant = await new TenantService(req).findById(tenantId)
        next()
      },
      safeWrap(require('./helpers/twitterAuthenticateCallback').default),
    )
  }

  /**
   * Discord integration endpoints
   */
  if (DISCORD_CONFIG.clientId) {
    // path to start the OAuth flow
    app.get(
      '/discord/:tenantId/connect',
      safeWrap(require('./helpers/discordAuthenticate').default),
    )

    // OAuth callback url
    app.get(
      '/discord/callback',
      (req, _res, next) => {
        const { crowdToken } = JSON.parse(Buffer.from(req.query.state, 'base64url').toString())
        req.headers.authorization = `Bearer ${crowdToken}`
        next()
      },
      authMiddleware,
      async (req, _res, next) => {
        const { tenantId } = JSON.parse(Buffer.from(req.query.state, 'base64url').toString())
        req.currentTenant = await new TenantService(req).findById(tenantId)
        next()
      },
      safeWrap(require('./helpers/discordAuthenticateCallback').default),
    )
  }

  /**
   * Slack integration endpoints
   * These should be super similar to Twitter's, since we're also using passport.js
   */
  if (SLACK_CONFIG.clientId) {
    passport.use(getSlackStrategy())

    // path to start the OAuth flow
    app.get('/slack/:tenantId/connect', safeWrap(require('./helpers/slackAuthenticate').default))

    // OAuth callback url
    app.get(
      '/slack/callback',
      passport.authorize('slack', {
        session: false,
        failureRedirect: '/',
      }),
      (req, _res, next) => {
        const { crowdToken } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.headers.authorization = `Bearer ${crowdToken}`
        next()
      },
      authMiddleware,
      async (req, _res, next) => {
        const { tenantId } = JSON.parse(Buffer.from(req.query.state, 'base64').toString())
        req.currentTenant = await new TenantService(req).findById(tenantId)
        next()
      },
      safeWrap(require('./helpers/slackAuthenticateCallback').default),
    )
  }
}
