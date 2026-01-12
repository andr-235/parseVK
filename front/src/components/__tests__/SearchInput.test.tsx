import { render, screen, fireEvent } from '@testing-library/react'
import SearchInput from '../SearchInput'

describe('SearchInput', () => {
  it('should render with placeholder', () => {
    const handleChange = jest.fn()
    render(<SearchInput value="" onChange={handleChange} placeholder="Поиск..." />)

    const input = screen.getByPlaceholderText('Поиск...')
    expect(input).toBeInTheDocument()
  })

  it('should call onChange when input value changes', () => {
    const handleChange = jest.fn()
    render(<SearchInput value="" onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })

    expect(handleChange).toHaveBeenCalledWith('test')
  })

  it('should show clear button when value is not empty', () => {
    const handleChange = jest.fn()
    render(<SearchInput value="test" onChange={handleChange} />)

    const clearButton = screen.getByLabelText('Очистить поиск')
    expect(clearButton).toBeInTheDocument()
  })

  it('should not show clear button when value is empty', () => {
    const handleChange = jest.fn()
    render(<SearchInput value="" onChange={handleChange} />)

    const clearButton = screen.queryByLabelText('Очистить поиск')
    expect(clearButton).not.toBeInTheDocument()
  })

  it('should clear value when clear button is clicked', () => {
    const handleChange = jest.fn()
    render(<SearchInput value="test" onChange={handleChange} />)

    const clearButton = screen.getByLabelText('Очистить поиск')
    fireEvent.click(clearButton)

    expect(handleChange).toHaveBeenCalledWith('')
  })

  it('should render with glass variant', () => {
    const handleChange = jest.fn()
    const { container } = render(<SearchInput value="" onChange={handleChange} variant="glass" />)

    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('backdrop-blur-md')
    expect(wrapper).toHaveClass('bg-white/70')
  })

  it('should render with leading icon', () => {
    const handleChange = jest.fn()
    render(
      <SearchInput
        value=""
        onChange={handleChange}
        leadingIcon={<span data-testid="icon">🔍</span>}
      />
    )

    const icon = screen.getByTestId('icon')
    expect(icon).toBeInTheDocument()
  })
})
