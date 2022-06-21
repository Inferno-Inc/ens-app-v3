import { ReactElement, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { PageButtons } from '@ensdomains/thorin'
import { ProfileSnippet } from '@app/components/ProfileSnippet'
import NoProfileSnippet from '@app/components/address/NoProfileSnippet'
import { NameListView } from '@app/components/@molecules/NameListView/NameListView'
import {
  SortDirection,
  SortType,
  SortValue,
} from '@app/components/@molecules/SortControl/SortControl'
import { useNamesFromAddress } from '@app/hooks/useNamesFromAddress'
import { shortenAddress } from '@app/utils/utils'
import { usePrimaryProfile } from '@app/hooks/usePrimaryProfile'
import FilterControl from '@app/components/address/FilterControl'
import { ContentGrid } from '@app/layouts/ContentGrid'
import { Content } from '@app/layouts/Content'
import { useChainId } from '../../hooks/useChainId'

const DetailsContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.space['2']};
  `,
)

const ContentContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    gap: ${theme.space['4']};
  `,
)

const PageButtonsWrapper = styled.div(
  () => css`
    display: flex;
    justify-content: flex-end;
  `,
)

const Page = () => {
  const { t } = useTranslation('address')
  const { query, isReady } = useRouter()
  const address = query.address as string
  const chainId = useChainId()

  const [page, setPage] = useState(1)

  // Filter Controls

  const [sortValue, setSortValue] = useState<SortValue>({
    type: SortType.expiryDate,
    direction: SortDirection.desc,
  })

  const [filter, setFilter] = useState<'registration' | 'domain' | 'none'>(
    'none',
  )

  const onFilterControlChange = (control: {
    sort: SortValue
    filter: 'registration' | 'domain' | 'none'
  }) => {
    const { sort: _sort, filter: _filter } = control
    let refresh = false
    if (
      _sort.type !== sortValue.type ||
      _sort.direction !== sortValue.direction
    ) {
      setSortValue(control.sort)
      refresh = true
    }
    if (_filter !== filter) {
      setFilter(_filter)
      refresh = true
    }
    if (refresh) setPage(1)
  }

  // Primary Profile

  const { profile: primaryProfile, loading: primaryProfileLoading } =
    usePrimaryProfile(address)

  const getTextRecord = (key: string) =>
    primaryProfile?.records?.texts?.find((x) => x.key === key)

  // Names

  const {
    currentPage = [],
    isLoading: namesLoading,
    status: namesStatus,
    pageLength,
    nameCount,
  } = useNamesFromAddress({
    address,
    sort: {
      type: sortValue.type,
      orderDirection: sortValue.direction,
    },
    page,
    resultsPerPage: 10,
    filter: filter === 'none' ? undefined : filter,
  })

  const loading = !isReady || namesLoading || primaryProfileLoading

  const hasErrors = namesStatus === 'error'

  const error = hasErrors ? t('errors.names') : ''

  return (
    <Content
      alwaysShowSubtitle
      subtitle={t('addressDetails')}
      title={shortenAddress(address)}
      loading={loading}
    >
      {{
        header: (
          <FilterControl
            sort={sortValue}
            filter={filter}
            resultsCount={nameCount}
            onChange={onFilterControlChange}
          />
        ),
        warning: error
          ? {
              type: 'warning',
              message: error,
            }
          : undefined,
        leading: (
          <DetailsContainer>
            {primaryProfile && primaryProfile.name ? (
              <>
                <ProfileSnippet
                  name={primaryProfile.name}
                  network={chainId}
                  button="viewProfile"
                  description={getTextRecord('description')?.value}
                  recordName={getTextRecord('name')?.value}
                  url={getTextRecord('url')?.value}
                />
              </>
            ) : (
              <>
                <NoProfileSnippet />
              </>
            )}
          </DetailsContainer>
        ),
        trailing: (
          <ContentContainer>
            <NameListView currentPage={currentPage || []} network={chainId} />
            <PageButtonsWrapper>
              <PageButtons
                current={page}
                onChange={(value) => setPage(value)}
                total={pageLength}
                max={5}
                alwaysShowFirst
                alwaysShowLast
              />
            </PageButtonsWrapper>
          </ContentContainer>
        ),
      }}
    </Content>
  )
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <ContentGrid>{page}</ContentGrid>
}

export default Page
