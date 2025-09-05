/********************************************************************************
** Form generated from reading UI file 'passworddialog.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_PASSWORDDIALOG_H
#define UI_PASSWORDDIALOG_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QPushButton>

QT_BEGIN_NAMESPACE

class Ui_PasswordDialog
{
public:
    QGridLayout *gridLayout;
    QGroupBox *groupBox;
    QLineEdit *m_passwordEdit;
    QPushButton *b1_okButton;
    QLabel *m_errorLabel;
    QLabel *label_3;
    QLabel *m_currentWalletTitle;

    void setupUi(QDialog *PasswordDialog)
    {
        if (PasswordDialog->objectName().isEmpty())
            PasswordDialog->setObjectName(QString::fromUtf8("PasswordDialog"));
        PasswordDialog->resize(450, 340);
        QSizePolicy sizePolicy(QSizePolicy::Preferred, QSizePolicy::Preferred);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(PasswordDialog->sizePolicy().hasHeightForWidth());
        PasswordDialog->setSizePolicy(sizePolicy);
        PasswordDialog->setMinimumSize(QSize(450, 280));
        PasswordDialog->setMaximumSize(QSize(450, 350));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        font.setPointSize(10);
        PasswordDialog->setFont(font);
        PasswordDialog->setStyleSheet(QString::fromUtf8(""));
        gridLayout = new QGridLayout(PasswordDialog);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        gridLayout->setContentsMargins(0, 0, 0, 0);
        groupBox = new QGroupBox(PasswordDialog);
        groupBox->setObjectName(QString::fromUtf8("groupBox"));
        groupBox->setMinimumSize(QSize(450, 340));
        groupBox->setMaximumSize(QSize(450, 340));
        groupBox->setAutoFillBackground(false);
        groupBox->setStyleSheet(QString::fromUtf8("background-color: #282d31; \n"
"border-radius: 5px;\n"
""));
        m_passwordEdit = new QLineEdit(groupBox);
        m_passwordEdit->setObjectName(QString::fromUtf8("m_passwordEdit"));
        m_passwordEdit->setGeometry(QRect(90, 160, 271, 40));
        QSizePolicy sizePolicy1(QSizePolicy::Expanding, QSizePolicy::Fixed);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(m_passwordEdit->sizePolicy().hasHeightForWidth());
        m_passwordEdit->setSizePolicy(sizePolicy1);
        m_passwordEdit->setMinimumSize(QSize(0, 25));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        m_passwordEdit->setFont(font1);
        m_passwordEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa;"));
        m_passwordEdit->setEchoMode(QLineEdit::Password);
        m_passwordEdit->setAlignment(Qt::AlignCenter);
        b1_okButton = new QPushButton(groupBox);
        b1_okButton->setObjectName(QString::fromUtf8("b1_okButton"));
        b1_okButton->setEnabled(true);
        b1_okButton->setGeometry(QRect(90, 230, 271, 40));
        b1_okButton->setMinimumSize(QSize(125, 25));
        b1_okButton->setFont(font1);
        b1_okButton->setStyleSheet(QString::fromUtf8("/* This style is handled automatically by EditableStyle.cpp */"));
        m_errorLabel = new QLabel(groupBox);
        m_errorLabel->setObjectName(QString::fromUtf8("m_errorLabel"));
        m_errorLabel->setGeometry(QRect(40, 110, 371, 31));
        m_errorLabel->setMinimumSize(QSize(122, 0));
        QFont font2;
        m_errorLabel->setFont(font2);
        m_errorLabel->setStyleSheet(QString::fromUtf8("color: #ffcb00; font-size: 16px; border: none;"));
        m_errorLabel->setAlignment(Qt::AlignCenter);
        label_3 = new QLabel(groupBox);
        label_3->setObjectName(QString::fromUtf8("label_3"));
        label_3->setGeometry(QRect(30, 40, 381, 31));
        label_3->setFont(font2);
        label_3->setStyleSheet(QString::fromUtf8("color: #fff;\n"
"border-right: 0px;\n"
"font-size: 20px;"));
        label_3->setAlignment(Qt::AlignCenter);
        m_currentWalletTitle = new QLabel(groupBox);
        m_currentWalletTitle->setObjectName(QString::fromUtf8("m_currentWalletTitle"));
        m_currentWalletTitle->setGeometry(QRect(40, 76, 371, 26));
        QFont font3;
        font3.setFamily(QString::fromUtf8("Roboto"));
        m_currentWalletTitle->setFont(font3);
        m_currentWalletTitle->setStyleSheet(QString::fromUtf8("color: #aaa;\n"
"border-right: 0px;"));
        m_currentWalletTitle->setAlignment(Qt::AlignCenter);

        gridLayout->addWidget(groupBox, 0, 0, 1, 1);


        retranslateUi(PasswordDialog);
        QObject::connect(b1_okButton, SIGNAL(clicked()), PasswordDialog, SLOT(accept()));

        b1_okButton->setDefault(true);


        QMetaObject::connectSlotsByName(PasswordDialog);
    } // setupUi

    void retranslateUi(QDialog *PasswordDialog)
    {
        PasswordDialog->setWindowTitle(QCoreApplication::translate("PasswordDialog", "Enter password", nullptr));
        groupBox->setTitle(QString());
        m_passwordEdit->setText(QString());
        m_passwordEdit->setPlaceholderText(QCoreApplication::translate("PasswordDialog", "Type your password...", nullptr));
        b1_okButton->setText(QCoreApplication::translate("PasswordDialog", "CONTINUE", nullptr));
        m_errorLabel->setText(QCoreApplication::translate("PasswordDialog", "Incorrect Password", nullptr));
        label_3->setText(QCoreApplication::translate("PasswordDialog", "Please Enter Your Password", nullptr));
        m_currentWalletTitle->setText(QCoreApplication::translate("PasswordDialog", "currentWallet", nullptr));
    } // retranslateUi

};

namespace Ui {
    class PasswordDialog: public Ui_PasswordDialog {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_PASSWORDDIALOG_H
