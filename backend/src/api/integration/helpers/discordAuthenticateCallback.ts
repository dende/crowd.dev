import request from 'superagent'
import { DISCORD_CONFIG, API_CONFIG } from '../../../config/index'

export default async (req, res) => {
  console.log(req.query)
  const { redirectUrl } = JSON.parse(Buffer.from(req.query.state, 'base64url').toString())
  const code = req.query.code
  const guildId = req.query.guild_id

  console.log(redirectUrl, code, guildId)

  const data = {
    client_id: DISCORD_CONFIG.clientId,
    client_secret: DISCORD_CONFIG.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${API_CONFIG.url}/discord/callback`,
  }

  console.log('data', data)

  const response = await request
    .post('https://discord.com/api/v10/oauth2/token')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .send(data)

  console.log(response.body)

  res.redirect(redirectUrl)
}
