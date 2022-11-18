import request from 'superagent'
import { DISCORD_CONFIG, API_CONFIG } from '../../../config/index'
import IntegrationService from '../../../services/integrationService'
import Permissions from '../../../security/permissions'
import PermissionChecker from '../../../services/user/permissionChecker'

export default async (req, res) => {
  try {
    // Checking we have permision to edit the integration
    new PermissionChecker(req).validateHas(Permissions.values.integrationEdit)

    const { redirectUrl } = JSON.parse(Buffer.from(req.query.state, 'base64url').toString())
    const code = req.query.code
    let guildId = req.query.guild_id

    const data = {
      client_id: DISCORD_CONFIG.clientId,
      client_secret: DISCORD_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${API_CONFIG.url}/discord/callback`,
    }

    console.log('discord callback data', data)

    const response = await request
      .post('https://discord.com/api/v10/oauth2/token')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(data)

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { access_token, expires_in, refresh_token, guild } = response.body

    console.log('discord callback auth data', response.body)

    if (!guildId) {
      guildId = guild.id
    }

    await new IntegrationService(req).discordConnect(
      guildId,
      access_token,
      refresh_token,
      expires_in,
    )

    res.redirect(redirectUrl)
  } catch (err) {
    req.log.error(err, 'Error while processing Discord OAuth2 callback!')
    let { redirectUrl } = JSON.parse(Buffer.from(req.query.state, 'base64url').toString())
    if (!redirectUrl) {
      redirectUrl = API_CONFIG.frontendUrl
    } else if (redirectUrl.includes('?')) {
      redirectUrl = `${redirectUrl}&error=discordauthcallback`
    } else {
      redirectUrl = `${redirectUrl}?error=discordauthcallback`
    }

    res.redirect(redirectUrl)
  }
}
