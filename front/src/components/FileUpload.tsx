import { useRef } from 'react'
import Input from './Input'
import Button from './Button'

interface FileUploadProps {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>
  accept?: string
  buttonText?: string
}

function FileUpload({ onUpload, accept = '.txt', buttonText = 'Загрузить из файла' }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    void onUpload(event)
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="file-upload-group">
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <Button onClick={triggerUpload}>
        {buttonText}
      </Button>
    </div>
  )
}

export default FileUpload
