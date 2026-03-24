import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TgmbaseSearchPage from '../components/TgmbaseSearchPage'
import { tgmbaseSearchService } from '../api/tgmbaseSearch.api'
import { io } from 'socket.io-client'

type MockSocketHandler = (payload?: unknown) => void

const socketHandlers = new Map<string, MockSocketHandler>()
const mockSocket = {
  connected: true,
  on: vi.fn((event: string, handler: MockSocketHandler) => {
    socketHandlers.set(event, handler)
    return mockSocket
  }),
  emit: vi.fn(),
  disconnect: vi.fn(),
}

vi.mock('../api/tgmbaseSearch.api', () => ({
  tgmbaseSearchService: {
    search: vi.fn(),
  },
}))

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

const mockedSearch = tgmbaseSearchService.search as unknown as ReturnType<typeof vi.fn>
const mockedIo = vi.mocked(io)

const resolveExpectedTgmbaseSocketUrl = () => {
  const raw = import.meta.env.VITE_API_WS_URL
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  const base =
    trimmed !== '' && trimmed.toLowerCase() !== 'auto' ? trimmed : `ws://${window.location.host}`

  return base.replace(/\/api$/i, '').replace(/\/tgmbase-search$/i, '') + '/tgmbase-search'
}

const createResponse = (overrides = {}) => ({
  summary: {
    total: 3,
    found: 1,
    notFound: 1,
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
    {
      query: '000',
      normalizedQuery: '000',
      queryType: 'telegramId',
      status: 'not_found',
      profile: null,
      candidates: [],
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
    socketHandlers.clear()
    mockSocket.on.mockClear()
    mockSocket.emit.mockClear()
    mockSocket.disconnect.mockClear()
  })

  it('submits multiple queries and renders batch workspace', async () => {
    mockedSearch.mockResolvedValue(createResponse())

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '123{enter}@demo{enter}000')
    await user.click(screen.getByRole('button', { name: /^найти$/i }))

    expect(await screen.findByText('Результаты батча')).toBeInTheDocument()
    expect(screen.getByText('Подготовлено запросов: 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Все 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Найдено 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Не найдено 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Детали результата' })).toBeInTheDocument()
    expect(mockedSearch.mock.calls[0]?.[0]).toMatchObject({
      queries: ['123', '@demo', '000'],
      page: 1,
      pageSize: 20,
    })
    expect(mockedIo).toHaveBeenCalledTimes(1)
    expect(mockedIo.mock.calls[0]?.[0]).toBe(resolveExpectedTgmbaseSocketUrl())
    expect(mockedIo.mock.calls[0]).toHaveLength(1)
  })

  it('filters results from summary controls and updates detail panel', async () => {
    mockedSearch.mockResolvedValue(createResponse())

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '123{enter}@demo{enter}000')
    await user.click(screen.getByRole('button', { name: /^найти$/i }))

    await user.click(await screen.findByRole('button', { name: 'Не найдено 1' }))

    const list = screen.getByRole('list', { name: 'Результаты поиска tgmbase' })
    expect(within(list).getByText('000')).toBeInTheDocument()
    expect(within(list).queryByText('123')).not.toBeInTheDocument()
    expect(screen.getByText('Совпадения не найдены')).toBeInTheDocument()
  })

  it('switches the detail panel when another result row is selected', async () => {
    mockedSearch.mockResolvedValue(createResponse())

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '123{enter}@demo{enter}000')
    await user.click(screen.getByRole('button', { name: /^найти$/i }))

    await user.click(await screen.findByRole('button', { name: /@demo username/i }))

    const details = screen.getByRole('region', { name: 'Панель деталей tgmbase' })
    expect(within(details).getByText('Demo One')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /123 telegramId/i }))

    expect(within(details).getByText('Ivan Petrov')).toBeInTheDocument()
    expect(within(details).getByText('Test Chat')).toBeInTheDocument()
  })

  it('loads more messages for the active result without replacing existing messages', async () => {
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
    await user.click(screen.getByRole('button', { name: /^найти$/i }))

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

  it('sends searchId and renders live progress while search is running', async () => {
    let resolveSearch!: (value: ReturnType<typeof createResponse>) => void
    mockedSearch.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSearch = resolve
        })
    )

    renderPage()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/список запросов/i), '123{enter}456')
    await user.click(screen.getByRole('button', { name: /^найти$/i }))

    await waitFor(() => {
      expect(mockedSearch).toHaveBeenCalled()
    })

    expect(mockedSearch.mock.calls[0]?.[0]).toMatchObject({
      queries: ['123', '456'],
      page: 1,
      pageSize: 20,
      searchId: expect.any(String),
    })

    act(() => {
      socketHandlers.get('connect')?.()
      socketHandlers.get('tgmbase-search-progress')?.({
        searchId: mockedSearch.mock.calls[0]?.[0].searchId,
        status: 'progress',
        processedQueries: 1,
        totalQueries: 2,
        currentBatch: 1,
        totalBatches: 1,
      })
    })

    expect(await screen.findByText('Обработано 1 из 2')).toBeInTheDocument()
    expect(screen.getByText('Батч 1 из 1')).toBeInTheDocument()

    act(() => {
      resolveSearch(createResponse())
    })

    expect(await screen.findByText('Результаты батча')).toBeInTheDocument()
  })
})
