# QREncode CMake Configuration
# This file provides CMake configuration for the QR code encoding library

# Find system libqrencode
find_package(PkgConfig REQUIRED)
pkg_check_modules(QRENCODE REQUIRED libqrencode)

# Create imported target for qrencode
add_library(qrencode INTERFACE IMPORTED)
target_link_libraries(qrencode INTERFACE ${QRENCODE_LIBRARIES})
target_include_directories(qrencode INTERFACE ${QRENCODE_INCLUDE_DIRS})
target_compile_options(qrencode INTERFACE ${QRENCODE_CFLAGS_OTHER})

# Set compile definitions for QR encode
target_compile_definitions(qrencode INTERFACE
    MAJOR_VERSION=4
    MINOR_VERSION=1
    MICRO_VERSION=2
    VERSION="4.1.2"
)