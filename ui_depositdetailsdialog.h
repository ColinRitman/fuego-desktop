/********************************************************************************
** Form generated from reading UI file 'depositdetailsdialog.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_DEPOSITDETAILSDIALOG_H
#define UI_DEPOSITDETAILSDIALOG_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QTextBrowser>
#include <QtWidgets/QVBoxLayout>

QT_BEGIN_NAMESPACE

class Ui_DepositDetailsDialog
{
public:
    QVBoxLayout *verticalLayout;
    QLabel *label;
    QTextBrowser *m_detailsBrowser;
    QHBoxLayout *horizontalLayout;
    QSpacerItem *horizontalSpacer;
    QPushButton *b1_okButton;
    QSpacerItem *horizontalSpacer_2;

    void setupUi(QDialog *DepositDetailsDialog)
    {
        if (DepositDetailsDialog->objectName().isEmpty())
            DepositDetailsDialog->setObjectName(QString::fromUtf8("DepositDetailsDialog"));
        DepositDetailsDialog->resize(800, 500);
        DepositDetailsDialog->setMinimumSize(QSize(0, 500));
        DepositDetailsDialog->setStyleSheet(QString::fromUtf8("background-color: #282d31;\n"
"color: #ddd;\n"
"border: 0px;\n"
""));
        verticalLayout = new QVBoxLayout(DepositDetailsDialog);
        verticalLayout->setObjectName(QString::fromUtf8("verticalLayout"));
        verticalLayout->setContentsMargins(15, 15, 15, 9);
        label = new QLabel(DepositDetailsDialog);
        label->setObjectName(QString::fromUtf8("label"));
        label->setMinimumSize(QSize(0, 31));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        label->setFont(font);
        label->setStyleSheet(QString::fromUtf8("color: #ddd;\n"
"   border-right: 0px;\n"
"   font-size: 20px;\n"
"   "));
        label->setAlignment(Qt::AlignCenter);

        verticalLayout->addWidget(label);

        m_detailsBrowser = new QTextBrowser(DepositDetailsDialog);
        m_detailsBrowser->setObjectName(QString::fromUtf8("m_detailsBrowser"));
        m_detailsBrowser->setFont(font);
        m_detailsBrowser->setStyleSheet(QString::fromUtf8("\n"
"color: #ddd;\n"
"border: 0px;\n"
""));

        verticalLayout->addWidget(m_detailsBrowser);

        horizontalLayout = new QHBoxLayout();
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        horizontalSpacer = new QSpacerItem(40, 20, QSizePolicy::Expanding, QSizePolicy::Minimum);

        horizontalLayout->addItem(horizontalSpacer);

        b1_okButton = new QPushButton(DepositDetailsDialog);
        b1_okButton->setObjectName(QString::fromUtf8("b1_okButton"));
        b1_okButton->setMinimumSize(QSize(210, 40));
        b1_okButton->setFont(font);
        b1_okButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));

        horizontalLayout->addWidget(b1_okButton);

        horizontalSpacer_2 = new QSpacerItem(40, 20, QSizePolicy::Expanding, QSizePolicy::Minimum);

        horizontalLayout->addItem(horizontalSpacer_2);


        verticalLayout->addLayout(horizontalLayout);


        retranslateUi(DepositDetailsDialog);
        QObject::connect(b1_okButton, SIGNAL(clicked()), DepositDetailsDialog, SLOT(accept()));

        QMetaObject::connectSlotsByName(DepositDetailsDialog);
    } // setupUi

    void retranslateUi(QDialog *DepositDetailsDialog)
    {
        DepositDetailsDialog->setWindowTitle(QCoreApplication::translate("DepositDetailsDialog", "Deposit Details", nullptr));
        label->setText(QCoreApplication::translate("DepositDetailsDialog", "DEPOSIT DETAILS", nullptr));
        m_detailsBrowser->setHtml(QCoreApplication::translate("DepositDetailsDialog", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:'Poppins'; font-size:11pt; font-weight:400; font-style:normal;\">\n"
"<p style=\"-qt-paragraph-type:empty; margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><br /></p></body></html>", nullptr));
        b1_okButton->setText(QCoreApplication::translate("DepositDetailsDialog", "CLOSE", nullptr));
    } // retranslateUi

};

namespace Ui {
    class DepositDetailsDialog: public Ui_DepositDetailsDialog {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_DEPOSITDETAILSDIALOG_H
