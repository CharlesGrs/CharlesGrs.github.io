Add-Type -AssemblyName System.Windows.Forms
$img = [System.Windows.Forms.Clipboard]::GetImage()
if ($img) {
    $img.Save($args[0], [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Image saved to: $($args[0])"
} else {
    Write-Host "No image in clipboard"
}
