/********************************************************************************
** Form generated from reading UI file 'mainwindow.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MAINWINDOW_H
#define UI_MAINWINDOW_H

#include <QtCore/QVariant>
#include <QtGui/QIcon>
#include <QtWidgets/QAction>
#include <QtWidgets/QApplication>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QWidget>
#include "gui/OverviewFrame.h"
#include "gui/ReceiveFrame.h"
#include "gui/WelcomeFrame.h"

QT_BEGIN_NAMESPACE

class Ui_MainWindow
{
public:
    QAction *m_overviewAction;
    QAction *m_receiveAction;
    QWidget *centralwidget;
    QGridLayout *gridLayout;
    WalletGui::WelcomeFrame *m_welcomeFrame;
    WalletGui::OverviewFrame *m_overviewFrame;
    WalletGui::ReceiveFrame *m_receiveFrame;

    void setupUi(QMainWindow *MainWindow)
    {
        if (MainWindow->objectName().isEmpty())
            MainWindow->setObjectName(QString::fromUtf8("MainWindow"));
        MainWindow->resize(1270, 650);
        QSizePolicy sizePolicy(QSizePolicy::Maximum, QSizePolicy::Maximum);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(MainWindow->sizePolicy().hasHeightForWidth());
        MainWindow->setSizePolicy(sizePolicy);
        MainWindow->setMinimumSize(QSize(1270, 650));
        MainWindow->setMaximumSize(QSize(16777215, 16777215));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        font.setPointSize(9);
        MainWindow->setFont(font);
        QIcon icon;
        icon.addFile(QString::fromUtf8(":/images/conceal-logo"), QSize(), QIcon::Normal, QIcon::Off);
        MainWindow->setWindowIcon(icon);
        MainWindow->setStyleSheet(QString::fromUtf8("background-color: #282d31;\n"
"color: #ccc;"));
        m_overviewAction = new QAction(MainWindow);
        m_overviewAction->setObjectName(QString::fromUtf8("m_overviewAction"));
        m_overviewAction->setCheckable(true);
        m_overviewAction->setEnabled(true);
        QFont font1;
        font1.setFamily(QString::fromUtf8("Source Sans Pro"));
        font1.setPointSize(10);
        m_overviewAction->setFont(font1);
        m_overviewAction->setVisible(true);
        m_receiveAction = new QAction(MainWindow);
        m_receiveAction->setObjectName(QString::fromUtf8("m_receiveAction"));
        m_receiveAction->setCheckable(true);
        m_receiveAction->setEnabled(true);
        m_receiveAction->setFont(font1);
        centralwidget = new QWidget(MainWindow);
        centralwidget->setObjectName(QString::fromUtf8("centralwidget"));
        sizePolicy.setHeightForWidth(centralwidget->sizePolicy().hasHeightForWidth());
        centralwidget->setSizePolicy(sizePolicy);
        centralwidget->setStyleSheet(QString::fromUtf8("background-color: #111;"));
        gridLayout = new QGridLayout(centralwidget);
        gridLayout->setSpacing(0);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        gridLayout->setContentsMargins(0, 0, 0, 0);
        m_welcomeFrame = new WalletGui::WelcomeFrame(centralwidget);
        m_welcomeFrame->setObjectName(QString::fromUtf8("m_welcomeFrame"));
        m_welcomeFrame->setFrameShape(QFrame::NoFrame);
        m_welcomeFrame->setFrameShadow(QFrame::Raised);

        gridLayout->addWidget(m_welcomeFrame, 0, 0, 1, 1);

        m_overviewFrame = new WalletGui::OverviewFrame(centralwidget);
        m_overviewFrame->setObjectName(QString::fromUtf8("m_overviewFrame"));
        m_overviewFrame->setFrameShape(QFrame::NoFrame);
        m_overviewFrame->setFrameShadow(QFrame::Raised);

        gridLayout->addWidget(m_overviewFrame, 0, 0, 1, 1);

        m_receiveFrame = new WalletGui::ReceiveFrame(centralwidget);
        m_receiveFrame->setObjectName(QString::fromUtf8("m_receiveFrame"));
        m_receiveFrame->setFrameShape(QFrame::NoFrame);
        m_receiveFrame->setFrameShadow(QFrame::Raised);

        gridLayout->addWidget(m_receiveFrame, 0, 0, 1, 1);

        MainWindow->setCentralWidget(centralwidget);

        retranslateUi(MainWindow);
        QObject::connect(m_overviewAction, SIGNAL(toggled(bool)), m_overviewFrame, SLOT(setVisible(bool)));
        QObject::connect(m_receiveAction, SIGNAL(toggled(bool)), m_receiveFrame, SLOT(setVisible(bool)));

        QMetaObject::connectSlotsByName(MainWindow);
    } // setupUi

    void retranslateUi(QMainWindow *MainWindow)
    {
        MainWindow->setWindowTitle(QCoreApplication::translate("MainWindow", "MainWindow", nullptr));
        m_overviewAction->setText(QCoreApplication::translate("MainWindow", "OVERVIEW", nullptr));
        m_receiveAction->setText(QCoreApplication::translate("MainWindow", "KEYS", nullptr));
    } // retranslateUi

};

namespace Ui {
    class MainWindow: public Ui_MainWindow {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINWINDOW_H
