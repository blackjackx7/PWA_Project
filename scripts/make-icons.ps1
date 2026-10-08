# Generate PWA icons (gradient background + white trend line) with System.Drawing
param([string]$App = 'stock')
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot "..\$App\icons"
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

function New-Icon([int]$size, [bool]$maskable, [bool]$rounded, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $c1 = [System.Drawing.Color]::FromArgb(220, 38, 38)
  $c2 = [System.Drawing.Color]::FromArgb(245, 158, 11)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $c1, $c2, 45
  if ($rounded) {
    $r = [int]($size * 0.22)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, 2*$r, 2*$r, 180, 90)
    $path.AddArc($size-2*$r, 0, 2*$r, 2*$r, 270, 90)
    $path.AddArc($size-2*$r, $size-2*$r, 2*$r, 2*$r, 0, 90)
    $path.AddArc(0, $size-2*$r, 2*$r, 2*$r, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
  } else {
    $g.FillRectangle($brush, $rect)
  }
  # keep the line inside the central safe zone for maskable icons
  $pad = if ($maskable) { 0.28 } else { 0.2 }
  $x0 = $size * $pad; $w = $size * (1 - 2*$pad)
  $y0 = $size * $pad; $h = $size * (1 - 2*$pad)
  $pts = @(
    (New-Object System.Drawing.PointF ($x0), ($y0 + $h*0.80)),
    (New-Object System.Drawing.PointF ($x0 + $w*0.30), ($y0 + $h*0.45)),
    (New-Object System.Drawing.PointF ($x0 + $w*0.52), ($y0 + $h*0.62)),
    (New-Object System.Drawing.PointF ($x0 + $w*0.80), ($y0 + $h*0.12)),
    (New-Object System.Drawing.PointF ($x0 + $w), ($y0 + $h*0.30))
  )
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), ($size * 0.075)
  $pen.StartCap = 'Round'; $pen.EndCap = 'Round'; $pen.LineJoin = 'Round'
  $g.DrawLines($pen, [System.Drawing.PointF[]]$pts)
  $g.Dispose()
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

New-Icon 192 $false $true  'icon-192.png'
New-Icon 512 $false $true  'icon-512.png'
New-Icon 512 $true  $false 'icon-maskable-512.png'
New-Icon 180 $false $false 'apple-touch-icon.png'
