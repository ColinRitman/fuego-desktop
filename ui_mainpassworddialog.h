/********************************************************************************
** Form generated from reading UI file 'mainpassworddialog.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MAINPASSWORDDIALOG_H
#define UI_MAINPASSWORDDIALOG_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QDialog>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLineEdit>
#include <QtWidgets/QPushButton>

QT_BEGIN_NAMESPACE

class Ui_MainPasswordDialog
{
public:
    QGridLayout *gridLayout;
    QGroupBox *passwordBox;
    QLineEdit *m_passwordEdit;
    QPushButton *b1_continue;
    QLabel *m_errorLabel;
    QLabel *title_welcome;
    QLabel *m_currentWalletTitle;
    QLabel *m_instructions;
    QLabel *m_version;
    QPushButton *m_helpButton;
    QPushButton *m_quitButton;
    QLabel *label;
    QPushButton *m_changeButton;
    QLabel *m_instructions_2;

    void setupUi(QDialog *MainPasswordDialog)
    {
        if (MainPasswordDialog->objectName().isEmpty())
            MainPasswordDialog->setObjectName(QString::fromUtf8("MainPasswordDialog"));
        MainPasswordDialog->resize(500, 500);
        QSizePolicy sizePolicy(QSizePolicy::Preferred, QSizePolicy::Preferred);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(MainPasswordDialog->sizePolicy().hasHeightForWidth());
        MainPasswordDialog->setSizePolicy(sizePolicy);
        MainPasswordDialog->setMinimumSize(QSize(500, 500));
        MainPasswordDialog->setMaximumSize(QSize(500, 500));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        font.setPointSize(10);
        MainPasswordDialog->setFont(font);
        MainPasswordDialog->setStyleSheet(QString::fromUtf8(""));
        gridLayout = new QGridLayout(MainPasswordDialog);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        gridLayout->setContentsMargins(0, 0, 0, 0);
        passwordBox = new QGroupBox(MainPasswordDialog);
        passwordBox->setObjectName(QString::fromUtf8("passwordBox"));
        passwordBox->setMinimumSize(QSize(500, 500));
        passwordBox->setMaximumSize(QSize(500, 500));
        passwordBox->setAutoFillBackground(false);
        passwordBox->setStyleSheet(QString::fromUtf8("background-color: #282d31; \n"
"border-radius: 8px;\n"
""));
        m_passwordEdit = new QLineEdit(passwordBox);
        m_passwordEdit->setObjectName(QString::fromUtf8("m_passwordEdit"));
        m_passwordEdit->setGeometry(QRect(70, 320, 271, 40));
        QSizePolicy sizePolicy1(QSizePolicy::Expanding, QSizePolicy::Fixed);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(m_passwordEdit->sizePolicy().hasHeightForWidth());
        m_passwordEdit->setSizePolicy(sizePolicy1);
        m_passwordEdit->setMinimumSize(QSize(0, 25));
        QFont font1;
        m_passwordEdit->setFont(font1);
        m_passwordEdit->setStyleSheet(QString::fromUtf8("padding: 3px; border: 1px solid #555; border-radius: 5px;   color: #aaa; font-size: 14px;"));
        m_passwordEdit->setFrame(false);
        m_passwordEdit->setEchoMode(QLineEdit::Password);
        m_passwordEdit->setAlignment(Qt::AlignCenter);
        b1_continue = new QPushButton(passwordBox);
        b1_continue->setObjectName(QString::fromUtf8("b1_continue"));
        b1_continue->setEnabled(true);
        b1_continue->setGeometry(QRect(350, 320, 91, 40));
        b1_continue->setMinimumSize(QSize(75, 25));
        QFont font2;
        font2.setFamily(QString::fromUtf8("Poppins"));
        b1_continue->setFont(font2);
        b1_continue->setStyleSheet(QString::fromUtf8("/* This button style is handled automatically */"));
        m_errorLabel = new QLabel(passwordBox);
        m_errorLabel->setObjectName(QString::fromUtf8("m_errorLabel"));
        m_errorLabel->setGeometry(QRect(70, 280, 371, 31));
        m_errorLabel->setMinimumSize(QSize(122, 0));
        m_errorLabel->setFont(font1);
        m_errorLabel->setStyleSheet(QString::fromUtf8("color: #ffcb00; font-size: 14px; border: none;"));
        m_errorLabel->setAlignment(Qt::AlignCenter);
        title_welcome = new QLabel(passwordBox);
        title_welcome->setObjectName(QString::fromUtf8("title_welcome"));
        title_welcome->setGeometry(QRect(60, 200, 381, 31));
        title_welcome->setFont(font1);
        title_welcome->setStyleSheet(QString::fromUtf8("color: #fff;\n"
"border-right: 0px;\n"
"font-size: 24px;"));
        title_welcome->setAlignment(Qt::AlignCenter);
        m_currentWalletTitle = new QLabel(passwordBox);
        m_currentWalletTitle->setObjectName(QString::fromUtf8("m_currentWalletTitle"));
        m_currentWalletTitle->setGeometry(QRect(70, 250, 371, 26));
        m_currentWalletTitle->setFont(font1);
        m_currentWalletTitle->setStyleSheet(QString::fromUtf8("color: #ccc;\n"
"        border-right: 0px;\n"
"         border: 0px;\n"
"font-size: 14px;"));
        m_currentWalletTitle->setAlignment(Qt::AlignCenter);
        m_instructions = new QLabel(passwordBox);
        m_instructions->setObjectName(QString::fromUtf8("m_instructions"));
        m_instructions->setGeometry(QRect(10, 370, 481, 31));
        m_instructions->setMinimumSize(QSize(122, 0));
        m_instructions->setFont(font1);
        m_instructions->setStyleSheet(QString::fromUtf8("color: #ccc; font-size: 14px; border: none;"));
        m_instructions->setAlignment(Qt::AlignCenter);
        m_version = new QLabel(passwordBox);
        m_version->setObjectName(QString::fromUtf8("m_version"));
        m_version->setGeometry(QRect(60, 230, 381, 21));
        m_version->setFont(font1);
        m_version->setStyleSheet(QString::fromUtf8("color: #ccc;\n"
"border-right: 0px;\n"
"font-size: 14px;"));
        m_version->setAlignment(Qt::AlignCenter);
        m_helpButton = new QPushButton(passwordBox);
        m_helpButton->setObjectName(QString::fromUtf8("m_helpButton"));
        m_helpButton->setEnabled(true);
        m_helpButton->setGeometry(QRect(200, 430, 100, 40));
        m_helpButton->setMinimumSize(QSize(75, 25));
        m_helpButton->setFont(font1);
        m_helpButton->setStyleSheet(QString::fromUtf8("QPushButton {\n"
"padding: 3px; background-color: #444; border-radius: 5px;   color: #aaa; font-size: 10px;\n"
"}\n"
"QPushButton:hover {\n"
"    color: #ffcb00;\n"
"}"));
        m_helpButton->setAutoDefault(false);
        m_quitButton = new QPushButton(passwordBox);
        m_quitButton->setObjectName(QString::fromUtf8("m_quitButton"));
        m_quitButton->setEnabled(true);
        m_quitButton->setGeometry(QRect(325, 430, 100, 40));
        m_quitButton->setMinimumSize(QSize(75, 25));
        m_quitButton->setFont(font1);
        m_quitButton->setStyleSheet(QString::fromUtf8("QPushButton {\n"
"padding: 3px; background-color: #444; border-radius: 5px;   color: #aaa; font-size: 10px;\n"
"}\n"
"QPushButton:hover {\n"
"    color: #ffcb00;\n"
"}"));
        m_quitButton->setAutoDefault(false);
        label = new QLabel(passwordBox);
        label->setObjectName(QString::fromUtf8("label"));
        label->setGeometry(QRect(170, 50, 150, 150));
        label->setStyleSheet(QString::fromUtf8("border: none;\n"
"padding: 20px;"));
        label->setPixmap(QPixmap(QString::fromUtf8(":/images/conceal-logo")));
        label->setScaledContents(true);
        m_changeButton = new QPushButton(passwordBox);
        m_changeButton->setObjectName(QString::fromUtf8("m_changeButton"));
        m_changeButton->setEnabled(true);
        m_changeButton->setGeometry(QRect(75, 430, 100, 40));
        m_changeButton->setMinimumSize(QSize(75, 25));
        m_changeButton->setFont(font1);
        m_changeButton->setStyleSheet(QString::fromUtf8("QPushButton {\n"
"padding: 3px; background-color: #444; border-radius: 5px;   color: #aaa; font-size: 10px;\n"
"}\n"
"QPushButton:hover {\n"
"    color: #ffcb00;\n"
"}"));
        m_changeButton->setAutoDefault(false);
        m_instructions_2 = new QLabel(passwordBox);
        m_instructions_2->setObjectName(QString::fromUtf8("m_instructions_2"));
        m_instructions_2->setGeometry(QRect(10, 400, 481, 31));
        m_instructions_2->setMinimumSize(QSize(122, 0));
        m_instructions_2->setFont(font1);
        m_instructions_2->setStyleSheet(QString::fromUtf8("color: #ccc; font-size: 14px; border: none;"));
        m_instructions_2->setAlignment(Qt::AlignCenter);

        gridLayout->addWidget(passwordBox, 0, 0, 1, 1);


        retranslateUi(MainPasswordDialog);
        QObject::connect(b1_continue, SIGNAL(clicked()), MainPasswordDialog, SLOT(accept()));
        QObject::connect(m_helpButton, SIGNAL(clicked()), MainPasswordDialog, SLOT(helpClicked()));
        QObject::connect(m_quitButton, SIGNAL(clicked()), MainPasswordDialog, SLOT(quitClicked()));
        QObject::connect(m_changeButton, SIGNAL(clicked()), MainPasswordDialog, SLOT(changeClicked()));

        b1_continue->setDefault(true);
        m_helpButton->setDefault(false);
        m_quitButton->setDefault(false);
        m_changeButton->setDefault(false);


        QMetaObject::connectSlotsByName(MainPasswordDialog);
    } // setupUi

    void retranslateUi(QDialog *MainPasswordDialog)
    {
        MainPasswordDialog->setWindowTitle(QCoreApplication::translate("MainPasswordDialog", "Enter password", nullptr));
        passwordBox->setTitle(QString());
        m_passwordEdit->setText(QString());
        m_passwordEdit->setPlaceholderText(QCoreApplication::translate("MainPasswordDialog", "Type your password...", nullptr));
        b1_continue->setText(QCoreApplication::translate("MainPasswordDialog", "CONTINUE", nullptr));
        m_errorLabel->setText(QCoreApplication::translate("MainPasswordDialog", "Incorrect Password. Please try again.", nullptr));
        title_welcome->setText(QCoreApplication::translate("MainPasswordDialog", "Welcome Back", nullptr));
        m_currentWalletTitle->setText(QCoreApplication::translate("MainPasswordDialog", "currentWallet", nullptr));
        m_instructions->setText(QCoreApplication::translate("MainPasswordDialog", "Click CONTINUE or press ENTER to unlock your wallet", nullptr));
        m_version->setText(QCoreApplication::translate("MainPasswordDialog", "Fuego Desktop 4.2.0", nullptr));
        m_helpButton->setText(QCoreApplication::translate("MainPasswordDialog", "HELP", nullptr));
        m_quitButton->setText(QCoreApplication::translate("MainPasswordDialog", "EXIT", nullptr));
        label->setText(QString());
        m_changeButton->setText(QCoreApplication::translate("MainPasswordDialog", "CHANGE", nullptr));
        m_instructions_2->setText(QCoreApplication::translate("MainPasswordDialog", "Click CHANGE to choose (or create) another wallet", nullptr));
    } // retranslateUi

};

namespace Ui {
    class MainPasswordDialog: public Ui_MainPasswordDialog {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINPASSWORDDIALOG_H
