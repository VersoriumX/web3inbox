import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import SettingsContext from '../../../../contexts/SettingsContext/context'
import './AppCard.scss'
import Button from '../../../general/Button'
import W3iContext from '../../../../contexts/W3iContext/context'
import { showErrorMessageToast, showSuccessMessageToast } from '../../../../utils/toasts'
import { handleImageFallback } from '../../../../utils/ui'
import Spinner from '../../../general/Spinner'
import Text from '../../../general/Text'
import VerifiedIcon from '../../../general/Icon/VerifiedIcon'
import CheckMarkIcon from '../../../general/Icon/CheckMarkIcon'

interface AppCardProps {
  name: string
  description: string
  logo: string
  bgColor: {
    dark: string
    light: string
  }
  url: string
}

const AppCard: React.FC<AppCardProps> = ({ name, description, logo, bgColor, url }) => {
  const [subscribing, setSubscribing] = useState(false)
  const { mode } = useContext(SettingsContext)
  const ref = useRef<HTMLDivElement>(null)
  const { pushClientProxy, userPubkey, pushProvider } = useContext(W3iContext)
  const cardBgColor = useMemo(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const specifiedMode = mode === 'system' ? systemTheme : mode

    return specifiedMode === 'dark' ? bgColor.dark : bgColor.light
  }, [mode, bgColor])

  const { activeSubscriptions } = useContext(W3iContext)

  const subscribed = activeSubscriptions.some(element => element.metadata.name === name)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--local-bg-color', cardBgColor)
    }
  }, [])

  const handleSubscription = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      console.log({ userPubkey })
      if (!userPubkey) {
        return
      }
      setSubscribing(true)
      try {
        pushClientProxy?.observeOne('notify_subscription', {
          next: () => {
            showSuccessMessageToast(`Subscribed to ${name}`)
          }
        })

        await pushClientProxy?.subscribe({
          account: `eip155:1:${userPubkey}`,
          appDomain: new URL(url).host
        })
      } catch (error) {
        console.log({ error })

        showErrorMessageToast(`Failed to subscribe to ${name}`)
      } finally {
        setSubscribing(false)
      }
    },
    [userPubkey, name, description, logo, bgColor, url, setSubscribing]
  )

  return (
    <div ref={ref} className="AppCard" rel="noopener noreferrer">
      <div className="AppCard__header">
        <img
          className="AppCard__header__logo"
          src={logo}
          alt={`${name} logo`}
          onError={handleImageFallback}
        />
        {subscribed ? (
          <>
            <Button disabled className="AppCard__mobile__button">
              Subscribed
              <CheckMarkIcon />
            </Button>
          </>
        ) : (
          <Button
            disabled={subscribing}
            className="AppCard__mobile__button"
            onClick={e => {
              handleSubscription(e)
            }}
          >
            {subscribing ? <Spinner width="1em" /> : 'Subscribe'}
          </Button>
        )}
      </div>
      <div className="AppCard__body">
        <div className="AppCard__body__title">
          <Text className="" variant="large-600">
            {name}
          </Text>
          <VerifiedIcon />
        </div>
        <Text className="AppCard__body__subtitle" variant="tiny-500">
          Official app
        </Text>
        <Text className="AppCard__body__description" variant="paragraph-500">
          {description}
        </Text>
        {subscribed ? (
          <>
            <Button disabled className="AppCard__body__subscribe">
              Subscribed
              <CheckMarkIcon />
            </Button>
          </>
        ) : (
          <Button
            disabled={subscribing}
            className="AppCard__body__subscribe"
            onClick={e => {
              handleSubscription(e)
            }}
          >
            {subscribing ? <Spinner width="1em" /> : 'Subscribe'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default AppCard
