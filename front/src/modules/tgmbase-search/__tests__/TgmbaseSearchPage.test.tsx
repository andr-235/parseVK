import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import TgmbaseSearchPage from '../components/TgmbaseSearchPage'
import { tgmbaseSearchService } from '../api/tgmbaseSearch.api'

vi.mock('../api/tgmbaseSearch.api', () => ({
  tgmbaseSearchService: {
    search: vi.fn(),
  },
}))

const mockedSearch = vi.mocked(tgmbaseSearchService.search)

const createResponse = (overrides = {}) => ({
  summary: {
    total: 2,
    found: 1,
    notFound: 0,
    ambiguous: 1,
    invalid: 0,
    error: 0,
  },
  items: [
    {
      query: '123',
      normalizedQuery: '123',
      queryType: 'telegramId',
      status: 'found',
      profile: {
        id: '1',
        telegramId: '123',
        username: 'demo',
        phoneNumber: null,
        firstName: 'Ivan',
        lastName: 'Petrov',
        fullName: 'Ivan Petrov',
        bot: false,
        scam: false,
        premium: false,
        updatedAt: '2024-06-01T00:00:00.000Z',
      },
      candidates: [],
      groups: [
        {
          peerId: '-1001',
          title: 'Test Chat',
          username: null,
          type: 'supergroup',
          participantsCount: null,
          region: 28,
        },
      ],
      contacts: [],
      messagesPage: {
        items: [
          {
            id: 'm1',
            messageId: '10',
            peerId: '-1001',
            peerTitle: 'Test Chat',
            peerType: 'supergroup',
            date: '2024-06-01T00:00:00.000Z',
            text: 'hello',
            fromId: '123',
            replyTo: null,
            hasMedia: false,
            hasKeywords: false,
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
        hasMore: false,
      },
      stats: {
        groups: 1,
        contacts: 0,
        messages: 1,
      },
      error: null,
    },
    {
      query: '@demo',
      normalizedQuery: 'demo',
      queryType: 'username',
      status: 'ambiguous',
      profile: null,
      candidates: [
        {
          telegramId: '111',
          username: 'demo',
          phoneNumber: null,
          fullName: 'Demo One',
        },
      ],
      groups: [],
      contacts: [],
      messagesPage: {
        items: [],
        page: 1,
        pageSize: 20,
        total: 0,
        hasMore: false,
      },
      stats: {
        groups: 0,
        contacts: 0,
        messages: 0,
      },
      error: null,
    },
  ],
  ...overrides,
})

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <TgmbaseSearchPage />
    </QueryClientProvider>
  )
}

describe('TgmbaseSearchPage', () => {
  beforeEach(() => {
    mockedSearch.mockReset()
  })

  it('submits multiple queries and renders summary rows', async () => {
    mockedSearch.mockResolvedValue(createResponse())

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '123{enter}@demo')
    await user.click(screen.getByRole('button', { name: /найти/i }))

    expect(await screen.findByText('Сводка по батчу')).toBeInTheDocument()
    expect((await screen.findAllByText('123')).length).toBeGreaterThan(0)
    expect((await screen.findAllByText('@demo')).length).toBeGreaterThan(0)
    expect(mockedSearch.mock.calls[0]?.[0]).toEqual({
      queries: ['123', '@demo'],
      page: 1,
      pageSize: 20,
    })
  })

  it('renders ambiguous state with candidate hint', async () => {
    mockedSearch.mockResolvedValue(createResponse())

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '@demo')
    await user.click(screen.getByRole('button', { name: /найти/i }))

    expect(await screen.findByText('Кандидаты')).toBeInTheDocument()
    expect((await screen.findAllByText(/Demo One/)).length).toBeGreaterThan(0)
  })

  it('renders not_found state', async () => {
    mockedSearch.mockResolvedValue(
      createResponse({
        summary: {
          total: 1,
          found: 0,
          notFound: 1,
          ambiguous: 0,
          invalid: 0,
          error: 0,
        },
        items: [
          {
            query: '000',
            normalizedQuery: '000',
            queryType: 'telegramId',
            status: 'not_found',
            profile: null,
            candidates: [],
            groups: [],
            contacts: [],
            messagesPage: { items: [], page: 1, pageSize: 20, total: 0, hasMore: false },
            stats: { groups: 0, contacts: 0, messages: 0 },
            error: null,
          },
        ],
      })
    )

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '000')
    await user.click(screen.getByRole('button', { name: /найти/i }))

    expect(await screen.findByText('Совпадения не найдены')).toBeInTheDocument()
  })

  it('scrolls to the result card when a summary row is clicked', async () => {
    mockedSearch.mockResolvedValue(createResponse())

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '123{enter}@demo')
    await user.click(screen.getByRole('button', { name: /найти/i }))

    const scrollSpy = vi.fn()
    const targetCard = (await screen.findAllByText('Ivan Petrov'))
      .map((element) => element.closest('[id]'))
      .find(Boolean)
    expect(targetCard).not.toBeNull()
    Object.defineProperty(targetCard as Element, 'scrollIntoView', {
      value: scrollSpy,
      configurable: true,
    })

    await user.click(screen.getAllByText('123')[0])

    await waitFor(() => {
      expect(scrollSpy).toHaveBeenCalled()
    })
  })

  it('loads more messages without replacing the existing list', async () => {
    mockedSearch
      .mockResolvedValueOnce(
        createResponse({
          summary: {
            total: 1,
            found: 1,
            notFound: 0,
            ambiguous: 0,
            invalid: 0,
            error: 0,
          },
          items: [
            {
              ...createResponse().items[0],
              query: '123',
              messagesPage: {
                items: [
                  {
                    id: 'm1',
                    messageId: '10',
                    peerId: '-1001',
                    peerTitle: 'Test Chat',
                    peerType: 'supergroup',
                    date: '2024-06-01T00:00:00.000Z',
                    text: 'first page',
                    fromId: '123',
                    replyTo: null,
                    hasMedia: false,
                    hasKeywords: false,
                  },
                ],
                page: 1,
                pageSize: 1,
                total: 2,
                hasMore: true,
              },
            },
          ],
        })
      )
      .mockResolvedValueOnce({
        summary: {
          total: 1,
          found: 1,
          notFound: 0,
          ambiguous: 0,
          invalid: 0,
          error: 0,
        },
        items: [
          {
            ...createResponse().items[0],
            query: '123',
            messagesPage: {
              items: [
                {
                  id: 'm2',
                  messageId: '11',
                  peerId: '-1001',
                  peerTitle: 'Test Chat',
                  peerType: 'supergroup',
                  date: '2024-06-02T00:00:00.000Z',
                  text: 'second page',
                  fromId: '123',
                  replyTo: null,
                  hasMedia: false,
                  hasKeywords: false,
                },
              ],
              page: 2,
              pageSize: 1,
              total: 2,
              hasMore: false,
            },
          },
        ],
      })

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '123')
    await user.click(screen.getByRole('button', { name: /найти/i }))

    expect(await screen.findByText('first page')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /показать ещё сообщения/i }))

    expect(await screen.findByText('second page')).toBeInTheDocument()
    expect(screen.getByText('first page')).toBeInTheDocument()
    expect(mockedSearch.mock.calls.at(-1)?.[0]).toEqual({
      queries: ['123'],
      page: 2,
      pageSize: 1,
    })
  })
})
