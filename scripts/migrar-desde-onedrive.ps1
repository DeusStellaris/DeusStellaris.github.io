# Migra Documentos, Imágenes, Music y Datos adjuntos desde OneDrive a las carpetas locales de Windows.
# No borra el origen: solo copia y compara. Uso: powershell -ExecutionPolicy Bypass -File scripts\migrar-desde-onedrive.ps1

$ErrorActionPreference = 'Stop'

$Origen = Join-Path $env:USERPROFILE 'OneDrive'
$Local = $env:USERPROFILE
$Pares = @(
  @{ Nombre = 'Documentos';    Desde = "$Origen\Documentos";    Hasta = "$Local\Documents" },
  @{ Nombre = 'Imágenes';      Desde = "$Origen\Imágenes";      Hasta = "$Local\Pictures" },
  @{ Nombre = 'Music';         Desde = "$Origen\Music";         Hasta = "$Local\Music" },
  @{ Nombre = 'Datos adjuntos'; Desde = "$Origen\Datos adjuntos"; Hasta = "$Local\Documents\Datos adjuntos" }
)

# CARTELES.

function Show-Cartel([string]$Texto, [ConsoleColor]$Fondo) {
  $linea = ' ' * ($Texto.Length + 4)
  Write-Host ''
  Write-Host $linea -BackgroundColor $Fondo
  Write-Host "  $Texto  " -BackgroundColor $Fondo -ForegroundColor Black
  Write-Host $linea -BackgroundColor $Fondo
  Write-Host ''
}

# VERIFICACIÓN DE CARPETAS OFICIALES.

function Test-CarpetasOficiales {
  $oficiales = @{
    Documents = [Environment]::GetFolderPath('MyDocuments')
    Desktop   = [Environment]::GetFolderPath('Desktop')
    Pictures  = [Environment]::GetFolderPath('MyPictures')
  }
  $dentro = @($oficiales.GetEnumerator() | Where-Object { $_.Value -like "$Origen*" })
  foreach ($c in $oficiales.GetEnumerator()) { Write-Host ("{0,-10} -> {1}" -f $c.Key, $c.Value) }
  if ($dentro.Count -gt 0) {
    Show-Cartel ('Todavía apuntan a OneDrive: ' + (($dentro | ForEach-Object Key) -join ', ')) Red
    Write-Host 'Cambiá la ubicación (clic derecho > Propiedades > Ubicación > Restablecer valores predeterminados) y volvé a correr el script.'
    exit 1
  }
}

# COMPARACIÓN: archivos del origen y su par en el destino con el mismo tamaño. Ignora junctions.

function Get-Archivos([string]$Ruta) {
  foreach ($e in Get-ChildItem -LiteralPath $Ruta -Force) {
    if ($e.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
    if ($e.PSIsContainer) { Get-Archivos $e.FullName } else { $e }
  }
}

function Compare-Par($Par) {
  $total = 0; $bytes = 0; $ok = 0; $bytesOk = 0
  foreach ($f in Get-Archivos $Par.Desde) {
    $total++; $bytes += $f.Length
    $rel = $f.FullName.Substring($Par.Desde.Length)
    $d = Get-Item -LiteralPath ($Par.Hasta + $rel) -Force -ErrorAction SilentlyContinue
    if ($d -and $d.Length -eq $f.Length) { $ok++; $bytesOk += $f.Length }
  }
  [pscustomobject]@{ Nombre = $Par.Nombre; Archivos = $total; ArchivosOk = $ok; Bytes = $bytes; BytesOk = $bytesOk }
}

# EJECUCIÓN.

Write-Host '1) Verificando carpetas oficiales...'
Test-CarpetasOficiales

Write-Host '2) Copiando con robocopy (el origen no se toca)...'
$log = Join-Path $env:TEMP 'migracion-onedrive.log'
foreach ($p in $Pares) {
  if (-not (Test-Path -LiteralPath $p.Desde)) { Write-Host "   Sin origen, se omite: $($p.Nombre)"; continue }
  Write-Host "   $($p.Nombre): $($p.Desde) -> $($p.Hasta)"
  # /E copia subcarpetas; sin /MIR ni /PURGE: nunca borra en el destino. /XJ evita bucles por junctions.
  robocopy $p.Desde $p.Hasta /E /COPY:DAT /DCOPY:DAT /XJ /R:2 /W:2 /MT:8 /NP /NFL /NDL /UNILOG+:$log | Out-Null
  if ($LASTEXITCODE -ge 8) { Show-Cartel "robocopy falló en $($p.Nombre) (código $LASTEXITCODE). Revisá $log" Red; exit 1 }
}

Write-Host '3) Comparando archivos y bytes entre origen y destino...'
$resultados = foreach ($p in $Pares) { if (Test-Path -LiteralPath $p.Desde) { Compare-Par $p } }
$resultados | Format-Table Nombre, Archivos, ArchivosOk, Bytes, BytesOk -AutoSize

$distintos = @($resultados | Where-Object { $_.Archivos -ne $_.ArchivosOk -or $_.Bytes -ne $_.BytesOk })
if ($distintos.Count -eq 0) {
  Show-Cartel ('Coincide al 100%: ya es seguro eliminar ' + $Origen + ' (desvinculá OneDrive primero).') Green
} else {
  Show-Cartel ('NO eliminar OneDrive: hay diferencias en ' + (($distintos | ForEach-Object Nombre) -join ', ') + '. Detalle en ' + $log) Red
  exit 1
}
