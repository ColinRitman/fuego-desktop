/********************************************************************************
** Form generated from reading UI file 'showqrcode.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_SHOWQRCODE_H
#define UI_SHOWQRCODE_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include "gui/QRLabel.h"

QT_BEGIN_NAMESPACE

class Ui_ShowQRCode
{
public:
    WalletGui::QRLabel *m_qrLabel;

    void setupUi(QDialog *ShowQRCode)
    {
        if (ShowQRCode->objectName().isEmpty())
            ShowQRCode->setObjectName(QString::fromUtf8("ShowQRCode"));
        ShowQRCode->resize(400, 400);
        ShowQRCode->setStyleSheet(QString::fromUtf8("background-color: #282d31; color: #ddd; border: 0px;"));
        m_qrLabel = new WalletGui::QRLabel(ShowQRCode);
        m_qrLabel->setObjectName(QString::fromUtf8("m_qrLabel"));
        m_qrLabel->setGeometry(QRect(50, 50, 300, 300));

        retranslateUi(ShowQRCode);

        QMetaObject::connectSlotsByName(ShowQRCode);
    } // setupUi

    void retranslateUi(QDialog *ShowQRCode)
    {
        ShowQRCode->setWindowTitle(QCoreApplication::translate("ShowQRCode", "Wallet Address QR Code", nullptr));
        m_qrLabel->setText(QString());
    } // retranslateUi

};

namespace Ui {
    class ShowQRCode: public Ui_ShowQRCode {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_SHOWQRCODE_H
