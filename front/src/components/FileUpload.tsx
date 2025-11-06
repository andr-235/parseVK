import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'

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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <Button onClick={triggerUpload} variant="outline" size="sm" className="w-full sm:w-auto border-dashed">
        <Upload className="mr-2 size-4" />
        {buttonText}
      </Button>
    </div>
  )
}

export default FileUpload
